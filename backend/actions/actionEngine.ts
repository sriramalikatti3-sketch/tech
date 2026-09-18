import crypto from 'crypto';
import {
  ActionRecord,
  ActionType,
  Decision,
  Subscription,
  ReviewQueueItem,
} from '../models/types.js';
import { store } from '../db/store.js';
import { defaultMerchantConnector, MerchantConnector } from '../connectors/merchant.js';

export class ActionEngine {
  private merchantConnector: MerchantConnector;

  constructor(merchantConnector: MerchantConnector = defaultMerchantConnector) {
    this.merchantConnector = merchantConnector;
  }

  /**
   * Dispatches an autonomous action or user-approved action through the verified execution pipeline.
   */
  async executeDecision(decision: Decision, subscription: Subscription): Promise<ActionRecord> {
    const actionType = decision.finalAction;

    // Generate deterministic idempotency key for this billing cycle
    const cycleKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    const idempotencyKey = `idem_${subscription.id}_${actionType}_${cycleKey}`;

    // Prevent duplicate actions
    const existingAction = store.getActionByIdempotency(idempotencyKey);
    if (existingAction) {
      store.addAuditLog({
        userId: subscription.userId,
        eventType: 'ACTION_BLOCKED',
        entityId: existingAction.actionId,
        entityType: 'action',
        description: `Duplicate action prevented by idempotency key: ${idempotencyKey}`,
        severity: 'warning',
        metadata: { subscriptionId: subscription.id, idempotencyKey },
      });
      return existingAction;
    }

    const actionId = `act_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const record: ActionRecord = {
      actionId,
      idempotencyKey,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      subscriptionName: subscription.name,
      amount: subscription.amount,
      decisionId: decision.id,
      actionType,
      guardrailResult: decision.guardrailEvaluation.passed ? 'passed' : decision.guardrailEvaluation.status === 'BLOCKED_BY_GUARDRAIL' ? 'blocked' : 'requires_approval',
      timestamp: new Date().toISOString(),
      executionStatus: 'pending',
      simulated: true,
    };

    store.saveAction(record);

    if (actionType === 'BLOCKED_BY_GUARDRAIL') {
      record.executionStatus = 'blocked';
      record.errorInfo = decision.guardrailEvaluation.reason;
      store.saveAction(record);

      store.addAuditLog({
        userId: subscription.userId,
        eventType: 'ACTION_BLOCKED',
        entityId: actionId,
        entityType: 'action',
        description: `Action on ${subscription.name} ($${subscription.amount}) BLOCKED by deterministic guardrail: ${decision.guardrailEvaluation.reason}`,
        severity: 'alert',
        metadata: {
          subscriptionId: subscription.id,
          rulesTriggered: decision.guardrailEvaluation.rulesTriggered,
        },
      });

      return record;
    }

    if (actionType === 'REQUEST_APPROVAL') {
      return this.requestUserApproval(record, decision, subscription);
    }

    if (actionType === 'AUTO_CANCEL') {
      return this.cancelSubscription(record, subscription);
    }

    if (actionType === 'AUTO_DOWNGRADE') {
      return this.downgradeSubscription(record, subscription);
    }

    if (actionType === 'CREATE_CANCELLATION_DRAFT') {
      return this.createCancellationDraft(record, subscription);
    }

    if (actionType === 'CREATE_NEGOTIATION_DRAFT') {
      return this.createNegotiationDraft(record, subscription);
    }

    // Default keep
    record.executionStatus = 'completed';
    store.saveAction(record);
    return record;
  }

  /**
   * Action Handler: cancelSubscription()
   */
  async cancelSubscription(action: ActionRecord, subscription: Subscription): Promise<ActionRecord> {
    action.executionStatus = 'executing';
    store.saveAction(action);

    try {
      // Call merchant connector
      const verification = await this.merchantConnector.cancelSubscription(
        subscription.merchant,
        subscription.id
      );

      if (!verification.verified) {
        throw new Error('Merchant API did not return positive verification token.');
      }

      action.executionStatus = 'verified';
      action.verificationResult = verification;
      store.saveAction(action);

      // Update subscription status
      subscription.status = 'cancelled';
      subscription.latestActionId = action.actionId;
      store.saveSubscription(subscription);

      store.addAuditLog({
        userId: subscription.userId,
        eventType: 'ACTION_VERIFIED',
        entityId: action.actionId,
        entityType: 'action',
        description: `Autonomous cancellation of ${subscription.name} ($${subscription.amount}/mo) successfully executed and verified with merchant API. Confirmation: ${verification.merchantConfirmationCode}`,
        severity: 'success',
        metadata: {
          subscriptionId: subscription.id,
          monthlySavings: subscription.amount,
          confirmationCode: verification.merchantConfirmationCode,
        },
      });

      return action;
    } catch (err: any) {
      action.executionStatus = 'failed';
      action.errorInfo = err.message || 'Execution error during cancellation';
      store.saveAction(action);

      store.addAuditLog({
        userId: subscription.userId,
        eventType: 'ACTION_BLOCKED',
        entityId: action.actionId,
        entityType: 'action',
        description: `Cancellation failed for ${subscription.name}: ${action.errorInfo}`,
        severity: 'alert',
        metadata: { error: action.errorInfo },
      });

      return action;
    }
  }

  /**
   * Action Handler: downgradeSubscription()
   */
  async downgradeSubscription(action: ActionRecord, subscription: Subscription): Promise<ActionRecord> {
    action.executionStatus = 'executing';
    store.saveAction(action);

    try {
      const verification = await this.merchantConnector.downgradeSubscription(
        subscription.merchant,
        subscription.id,
        'Basic Tier'
      );

      action.executionStatus = 'verified';
      action.verificationResult = verification;
      store.saveAction(action);

      // Adjust price for downgrade
      const previousAmount = subscription.amount;
      subscription.amount = Math.round(previousAmount * 0.6 * 100) / 100; // 40% reduction
      subscription.latestActionId = action.actionId;
      store.saveSubscription(subscription);

      store.addAuditLog({
        userId: subscription.userId,
        eventType: 'ACTION_VERIFIED',
        entityId: action.actionId,
        entityType: 'action',
        description: `Autonomous tier downgrade of ${subscription.name} from ₹${previousAmount} to ₹${subscription.amount}/mo verified.`,
        severity: 'success',
        metadata: {
          subscriptionId: subscription.id,
          savedMonthly: previousAmount - subscription.amount,
        },
      });

      return action;
    } catch (err: any) {
      action.executionStatus = 'failed';
      action.errorInfo = err.message;
      store.saveAction(action);
      return action;
    }
  }

  /**
   * Action Handler: createCancellationDraft()
   */
  async createCancellationDraft(action: ActionRecord, subscription: Subscription): Promise<ActionRecord> {
    action.draftSubject = `Request for Immediate Cancellation - Account Subscription #${subscription.id}`;
    action.draftBody = `Dear ${subscription.merchant} Support,\n\nI am writing to formally request the immediate cancellation of my ${subscription.name} subscription effective on the end of the current billing cycle. Please confirm that no further charges will be billed to my account.\n\nThank you,\nAccount Holder`;
    action.executionStatus = 'verified';
    action.verificationResult = {
      verified: true,
      verifiedAt: new Date().toISOString(),
      merchantResponse: 'Cancellation draft generated and stored for authorized transmission.',
      verificationMethod: 'email_receipt',
    };
    store.saveAction(action);

    store.addAuditLog({
      userId: subscription.userId,
      eventType: 'ACTION_VERIFIED',
      entityId: action.actionId,
      entityType: 'action',
      description: `Formal cancellation draft prepared for ${subscription.name}.`,
      severity: 'info',
      metadata: { subscriptionId: subscription.id },
    });

    return action;
  }

  /**
   * Action Handler: createNegotiationDraft()
   */
  async createNegotiationDraft(action: ActionRecord, subscription: Subscription): Promise<ActionRecord> {
    const prevAmountStr = subscription.previousAmount ? `₹${subscription.previousAmount}` : 'my initial rate';
    action.draftSubject = `Loyalty Plan Review & Retention Rate Request - ${subscription.name}`;
    action.draftBody = `Dear ${subscription.merchant} Retention Team,\n\nI have been a loyal customer of ${subscription.name} since ${subscription.firstSeenDate}. I recently noticed a price increase from ${prevAmountStr} to ₹${subscription.amount.toFixed(2)}/month. Given competing alternatives in the market, I would like to explore maintaining my legacy rate or applying an active loyalty discount.\n\nPlease let me know what options are available to continue my subscription.\n\nSincerely,\nAccount Holder`;
    action.executionStatus = 'verified';
    action.verificationResult = {
      verified: true,
      verifiedAt: new Date().toISOString(),
      merchantResponse: 'Negotiation letter draft generated and attached to record.',
      verificationMethod: 'email_receipt',
    };
    store.saveAction(action);

    store.addAuditLog({
      userId: subscription.userId,
      eventType: 'ACTION_VERIFIED',
      entityId: action.actionId,
      entityType: 'action',
      description: `Price negotiation letter drafted for ${subscription.name} due to price change.`,
      severity: 'info',
      metadata: { subscriptionId: subscription.id },
    });

    return action;
  }

  /**
   * Action Handler: requestUserApproval()
   * Enters item into Review Center with option details.
   */
  async requestUserApproval(
    action: ActionRecord,
    decision: Decision,
    subscription: Subscription
  ): Promise<ActionRecord> {
    action.executionStatus = 'completed';
    store.saveAction(action);

    // Look for overlapping partner if duplicate
    let overlappingSub: ReviewQueueItem['overlappingSubscription'] | undefined;
    if (subscription.overlappingWith && subscription.overlappingWith.length > 0) {
      const partner = store.getSubscription(subscription.overlappingWith[0]);
      if (partner) {
        overlappingSub = {
          id: partner.id,
          name: partner.name,
          amount: partner.amount,
          daysSinceLastUsed: partner.daysSinceLastUsed,
        };
      }
    }

    // Check if an item is already in review queue for this sub
    const existingQueue = store.getReviewQueue().find(r => r.subscriptionId === subscription.id && r.status === 'pending');
    if (!existingQueue) {
      const queueItem: ReviewQueueItem = {
        id: `rev_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        userId: subscription.userId,
        subscriptionId: subscription.id,
        subscriptionName: subscription.name,
        amount: subscription.amount,
        category: subscription.category,
        reason: decision.reason,
        duplicateOf: subscription.duplicateGroup,
        overlappingSubscription: overlappingSub,
        options: subscription.duplicateGroup
          ? [
              { action: 'CANCEL_THIS', label: `Cancel ${subscription.name} ($${subscription.amount}/mo)` },
              { action: 'CANCEL_OTHER', label: `Cancel ${overlappingSub?.name || 'Duplicate'} ($${overlappingSub?.amount || ''}/mo)` },
              { action: 'KEEP_BOTH', label: 'Keep Both Services' },
            ]
          : [
              { action: 'CANCEL_THIS', label: `Confirm Cancellation ($${subscription.amount}/mo savings)` },
              { action: 'DISMISS', label: 'Keep Subscription' },
            ],
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      store.saveReviewQueueItem(queueItem);
    }

    store.addAuditLog({
      userId: subscription.userId,
      eventType: 'USER_APPROVAL_REQUESTED',
      entityId: action.actionId,
      entityType: 'action',
      description: `Approval requested for ${subscription.name} ($${subscription.amount}/mo): ${decision.guardrailEvaluation.reason}`,
      severity: 'warning',
      metadata: {
        subscriptionId: subscription.id,
        rulesTriggered: decision.guardrailEvaluation.rulesTriggered,
      },
    });

    return action;
  }

  /**
   * User explicitly authorizes an action from Review Center
   */
  async executeUserApprovedAction(
    subscriptionId: string,
    actionChoice: 'CANCEL' | 'DOWNGRADE' | 'KEEP',
    reviewItemId?: string
  ): Promise<ActionRecord> {
    let sub = store.getSubscription(subscriptionId);
    if (!sub && reviewItemId) {
      const reviewItem = store.getReviewQueueItem(reviewItemId);
      if (reviewItem) {
        sub = store.getSubscription(reviewItem.subscriptionId) ||
          store.getSubscriptions(reviewItem.userId).find(s => s.name.toLowerCase() === reviewItem.subscriptionName.toLowerCase());
      }
    }

    if (!sub) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    if (reviewItemId) {
      const item = store.getReviewQueueItem(reviewItemId);
      if (item) {
        item.status = 'resolved';
        item.resolvedAt = new Date().toISOString();
        item.resolutionNote = `User confirmed ${actionChoice}`;
        store.saveReviewQueueItem(item);
      }
    }

    const actionId = `act_user_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const idempotencyKey = `idem_user_${subscriptionId}_${actionChoice}_${Date.now()}`;

    const record: ActionRecord = {
      actionId,
      idempotencyKey,
      userId: sub.userId,
      subscriptionId: sub.id,
      subscriptionName: sub.name,
      amount: sub.amount,
      decisionId: sub.latestDecisionId || 'user_override',
      actionType: actionChoice === 'CANCEL' ? 'AUTO_CANCEL' : actionChoice === 'DOWNGRADE' ? 'AUTO_DOWNGRADE' : 'KEEP',
      guardrailResult: 'passed',
      timestamp: new Date().toISOString(),
      executionStatus: 'pending',
      simulated: true,
    };

    store.saveAction(record);

    store.addAuditLog({
      userId: sub.userId,
      eventType: 'USER_ACTION_EXECUTED',
      entityId: actionId,
      entityType: 'action',
      description: `User manually authorized ${actionChoice} for ${sub.name} (₹${sub.amount}/mo).`,
      severity: 'info',
      metadata: { subscriptionId: sub.id, actionChoice },
    });

    if (actionChoice === 'CANCEL') {
      return this.cancelSubscription(record, sub);
    } else if (actionChoice === 'DOWNGRADE') {
      return this.downgradeSubscription(record, sub);
    } else {
      record.executionStatus = 'completed';
      store.saveAction(record);
      return record;
    }
  }
}

export const actionEngine = new ActionEngine();
