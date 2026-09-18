import {
  Subscription,
  GuardrailConfig,
  ActionType,
  RiskLevel,
  GuardrailEvaluation,
  Decision,
} from '../models/types.js';
import crypto from 'crypto';

export class GuardrailEngine {
  /**
   * Evaluates AI recommendations against deterministic rules.
   * Final authority rests purely with deterministic policy logic.
   */
  evaluate(params: {
    subscription: Subscription;
    aiRecommendation: ActionType;
    confidenceScore: number;
    wasteScore: number;
    riskLevel: RiskLevel;
    guardrails: GuardrailConfig;
    reasoning: string;
    evidence: string[];
  }): Decision {
    const {
      subscription,
      aiRecommendation,
      confidenceScore,
      wasteScore,
      riskLevel,
      guardrails,
      reasoning,
      evidence,
    } = params;

    const rulesTriggered: string[] = [];
    let finalAction: ActionType = aiRecommendation;
    let status: GuardrailEvaluation['status'] = 'APPROVED_FOR_AUTO';
    let guardrailReason = 'All deterministic guardrails passed. Authorized for autonomous execution.';

    const checks = {
      pauseCheck: !guardrails.pauseAutomation,
      amountCheck: subscription.amount <= guardrails.maxAutoAmount,
      categoryCheck: true,
      merchantCheck: true,
      duplicateAmbiguityCheck: true,
      confidenceCheck: confidenceScore >= guardrails.minConfidence,
      riskCheck: true,
    };

    // 1. INVARIANT CHECK: Protected Categories (Insurance, Loans, Rent, Taxes, Healthcare)
    // NEVER automatically touch protected categories!
    const subCategoryLower = subscription.category.trim().toLowerCase();
    const isProtectedCategory = guardrails.protectedCategories.some(cat => {
      const c = cat.trim().toLowerCase();
      return subCategoryLower === c || subCategoryLower.includes(c);
    });

    if (isProtectedCategory) {
      checks.categoryCheck = false;
      rulesTriggered.push('RULE_PROTECTED_CATEGORY');
      status = 'BLOCKED_BY_GUARDRAIL';
      finalAction = 'BLOCKED_BY_GUARDRAIL';
      guardrailReason = `Category "${subscription.category}" is strictly protected. Automatic actions are blocked by deterministic policy to prevent essential service or coverage lapse.`;

      return this.createDecisionRecord(
        subscription,
        aiRecommendation,
        finalAction,
        status,
        guardrailReason,
        rulesTriggered,
        checks,
        confidenceScore,
        wasteScore,
        riskLevel,
        reasoning,
        evidence
      );
    }

    // 2. CHECK: Protected Merchants
    const isProtectedMerchant = guardrails.protectedMerchants.some(merch => {
      const m = merch.trim().toLowerCase();
      return (
        subscription.merchant.toLowerCase().includes(m) ||
        subscription.name.toLowerCase().includes(m)
      );
    });

    if (isProtectedMerchant) {
      checks.merchantCheck = false;
      rulesTriggered.push('RULE_PROTECTED_MERCHANT');
      status = 'BLOCKED_BY_GUARDRAIL';
      finalAction = 'BLOCKED_BY_GUARDRAIL';
      guardrailReason = `Merchant "${subscription.merchant}" is on the protected merchants list. Automatic action is blocked.`;

      return this.createDecisionRecord(
        subscription,
        aiRecommendation,
        finalAction,
        status,
        guardrailReason,
        rulesTriggered,
        checks,
        confidenceScore,
        wasteScore,
        riskLevel,
        reasoning,
        evidence
      );
    }

    // 3. CHECK: Overlapping / Duplicate Services (Ambiguity Guard)
    // "Never automatically choose between overlapping services when user preference is unknown."
    const hasDuplicateOverlap =
      Boolean(subscription.duplicateGroup) ||
      Boolean(subscription.overlappingWith && subscription.overlappingWith.length > 0);

    if (hasDuplicateOverlap) {
      checks.duplicateAmbiguityCheck = false;
      rulesTriggered.push('RULE_DUPLICATE_AMBIGUITY');
      // Must require user approval!
      status = 'REQUIRES_USER_APPROVAL';
      finalAction = 'REQUEST_APPROVAL';
      guardrailReason = `Overlapping service detected with ${subscription.overlappingWith?.length || 1} peer provider(s) in "${subscription.duplicateGroup || subscription.category}". User preference is unknown; autonomous choice is prohibited.`;

      return this.createDecisionRecord(
        subscription,
        aiRecommendation,
        finalAction,
        status,
        guardrailReason,
        rulesTriggered,
        checks,
        confidenceScore,
        wasteScore,
        riskLevel,
        reasoning,
        evidence
      );
    }

    // 4. CHECK: Global Automation Pause
    if (guardrails.pauseAutomation) {
      checks.pauseCheck = false;
      rulesTriggered.push('RULE_PAUSE_AUTOMATION_ACTIVE');
      status = 'REQUIRES_USER_APPROVAL';
      finalAction = 'REQUEST_APPROVAL';
      guardrailReason = 'Global automation switch is paused. All actions require manual user confirmation.';

      return this.createDecisionRecord(
        subscription,
        aiRecommendation,
        finalAction,
        status,
        guardrailReason,
        rulesTriggered,
        checks,
        confidenceScore,
        wasteScore,
        riskLevel,
        reasoning,
        evidence
      );
    }

    // 5. CHECK: Amount Limit Guard
    // "Never execute an action above the user's configured limit."
    if (subscription.amount > guardrails.maxAutoAmount) {
      checks.amountCheck = false;
      rulesTriggered.push('RULE_AMOUNT_EXCEEDS_LIMIT');
      status = 'REQUIRES_USER_APPROVAL';
      finalAction = 'REQUEST_APPROVAL';
      guardrailReason = `Subscription amount (₹${subscription.amount.toFixed(2)}) exceeds maximum configured automatic limit (₹${guardrails.maxAutoAmount.toFixed(2)}). Escalated for user authorization.`;

      return this.createDecisionRecord(
        subscription,
        aiRecommendation,
        finalAction,
        status,
        guardrailReason,
        rulesTriggered,
        checks,
        confidenceScore,
        wasteScore,
        riskLevel,
        reasoning,
        evidence
      );
    }

    // 6. CHECK: Confidence Threshold
    if (confidenceScore < guardrails.minConfidence) {
      checks.confidenceCheck = false;
      rulesTriggered.push('RULE_CONFIDENCE_BELOW_MINIMUM');
      status = 'REQUIRES_USER_APPROVAL';
      finalAction = 'REQUEST_APPROVAL';
      guardrailReason = `AI confidence score (${confidenceScore}%) is below required minimum threshold (${guardrails.minConfidence}%). Escalated to Review Center.`;

      return this.createDecisionRecord(
        subscription,
        aiRecommendation,
        finalAction,
        status,
        guardrailReason,
        rulesTriggered,
        checks,
        confidenceScore,
        wasteScore,
        riskLevel,
        reasoning,
        evidence
      );
    }

    // 7. CHECK: Risk Level Guard
    if (guardrails.maxAutoRisk === 'LOW' && riskLevel !== 'LOW') {
      checks.riskCheck = false;
      rulesTriggered.push('RULE_RISK_LEVEL_EXCEEDS_POLICY');
      status = 'REQUIRES_USER_APPROVAL';
      finalAction = 'REQUEST_APPROVAL';
      guardrailReason = `Action risk level (${riskLevel}) exceeds maximum allowed automatic risk (${guardrails.maxAutoRisk}). Escalated to Review Center.`;

      return this.createDecisionRecord(
        subscription,
        aiRecommendation,
        finalAction,
        status,
        guardrailReason,
        rulesTriggered,
        checks,
        confidenceScore,
        wasteScore,
        riskLevel,
        reasoning,
        evidence
      );
    }

    // 8. CHECK: Allowed Automatic Action Types
    if (aiRecommendation.startsWith('AUTO_') && !guardrails.allowedAutoActions.includes(aiRecommendation)) {
      rulesTriggered.push('RULE_ACTION_NOT_IN_ALLOWED_LIST');
      status = 'REQUIRES_USER_APPROVAL';
      finalAction = 'REQUEST_APPROVAL';
      guardrailReason = `Action type "${aiRecommendation}" is not enabled for autonomous execution in user guardrail settings.`;

      return this.createDecisionRecord(
        subscription,
        aiRecommendation,
        finalAction,
        status,
        guardrailReason,
        rulesTriggered,
        checks,
        confidenceScore,
        wasteScore,
        riskLevel,
        reasoning,
        evidence
      );
    }

    // If ai recommendation was already keep or request approval
    if (aiRecommendation === 'KEEP') {
      status = 'APPROVED_FOR_AUTO';
      finalAction = 'KEEP';
      guardrailReason = 'Subscription actively used or essential; retained in good standing.';
    } else if (aiRecommendation === 'REQUEST_APPROVAL') {
      status = 'REQUIRES_USER_APPROVAL';
      finalAction = 'REQUEST_APPROVAL';
      guardrailReason = 'Escalated to Review Center per AI recommendation.';
    }

    return this.createDecisionRecord(
      subscription,
      aiRecommendation,
      finalAction,
      status,
      guardrailReason,
      rulesTriggered,
      checks,
      confidenceScore,
      wasteScore,
      riskLevel,
      reasoning,
      evidence
    );
  }

  private createDecisionRecord(
    subscription: Subscription,
    aiRecommendation: ActionType,
    finalAction: ActionType,
    status: GuardrailEvaluation['status'],
    reason: string,
    rulesTriggered: string[],
    checks: GuardrailEvaluation['checks'],
    confidenceScore: number,
    wasteScore: number,
    riskLevel: RiskLevel,
    aiReasoning: string,
    evidence: string[]
  ): Decision {
    const passed = status === 'APPROVED_FOR_AUTO';
    return {
      id: `dec_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      subscriptionId: subscription.id,
      userId: subscription.userId,
      timestamp: new Date().toISOString(),
      aiRecommendation,
      guardrailEvaluation: {
        passed,
        status,
        reason,
        rulesTriggered,
        checks,
      },
      finalAction,
      confidenceScore,
      wasteScore,
      riskLevel,
      reason: `${reason} (AI note: ${aiReasoning})`,
      evidence,
    };
  }
}

export const guardrailEngine = new GuardrailEngine();
