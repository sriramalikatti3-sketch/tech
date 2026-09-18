export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

export type SubscriptionStatus = 'active' | 'cancelling' | 'cancelled' | 'paused' | 'negotiating';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ActionType = 
  | 'AUTO_CANCEL' 
  | 'AUTO_DOWNGRADE' 
  | 'CREATE_CANCELLATION_DRAFT' 
  | 'CREATE_NEGOTIATION_DRAFT' 
  | 'REQUEST_APPROVAL' 
  | 'KEEP' 
  | 'BLOCKED_BY_GUARDRAIL'
  | 'USER_APPROVED_CANCEL';

export type ExecutionStatus = 
  | 'pending' 
  | 'executing' 
  | 'completed' 
  | 'verified' 
  | 'failed' 
  | 'blocked';

export type GuardrailDecisionStatus = 
  | 'APPROVED_FOR_AUTO' 
  | 'REQUIRES_USER_APPROVAL' 
  | 'BLOCKED_BY_GUARDRAIL';

export interface PriceHistoryEntry {
  date: string;
  amount: number;
  isIncrease?: boolean;
  isTrialConversion?: boolean;
  note?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  amount: number;
  currency?: string;
  merchant: string;
  category: string;
  pending?: boolean;
  rawDescription?: string;
  description?: string;
  isRecurring?: boolean;
  subscriptionId?: string;
  accountId?: string;
  accountName?: string;
  simulated?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  merchant: string;
  category: string; // e.g. 'Entertainment', 'Productivity', 'Insurance', 'Music', 'Cloud'
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  firstSeenDate: string;
  lastChargeDate: string;
  nextChargeDate: string;
  daysSinceLastUsed: number;
  usageLevel: 'high' | 'medium' | 'low' | 'unused';
  priceHistory: PriceHistoryEntry[];
  isTrialConversion: boolean;
  isPriceIncrease: boolean;
  previousAmount?: number;
  duplicateGroup?: string; // e.g. 'music_streaming'
  overlappingWith?: string[]; // IDs of duplicate/overlapping subscriptions
  wasteScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  riskLevel: RiskLevel;
  analysisReasoning: string;
  evidence: string[];
  latestDecisionId?: string;
  latestActionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuardrailConfig {
  userId: string;
  maxAutoAmount: number; // e.g. 20.00
  protectedCategories: string[]; // e.g. ['insurance', 'loan payments', 'healthcare', 'taxes', 'rent']
  protectedMerchants: string[]; // e.g. ['HealthGuard Insurance', 'Vanguard']
  minConfidence: number; // e.g. 80
  maxAutoRisk: RiskLevel; // e.g. 'LOW' or 'MEDIUM'
  allowedAutoActions: ActionType[];
  pauseAutomation: boolean;
  updatedAt: string;
}

export interface GuardrailEvaluation {
  passed: boolean;
  status: GuardrailDecisionStatus;
  reason: string;
  rulesTriggered: string[];
  checks: {
    pauseCheck: boolean;
    amountCheck: boolean;
    categoryCheck: boolean;
    merchantCheck: boolean;
    duplicateAmbiguityCheck: boolean;
    confidenceCheck: boolean;
    riskCheck: boolean;
  };
}

export interface Decision {
  id: string;
  subscriptionId: string;
  userId: string;
  timestamp: string;
  aiRecommendation: ActionType;
  guardrailEvaluation: GuardrailEvaluation;
  finalAction: ActionType;
  confidenceScore: number;
  wasteScore: number;
  riskLevel: RiskLevel;
  reason: string;
  evidence: string[];
}

export interface ActionVerification {
  verified: boolean;
  verifiedAt: string;
  merchantConfirmationCode?: string;
  confirmationCode?: string;
  merchantResponse: string;
  verificationMethod: 'direct_api' | 'email_receipt' | 'status_endpoint' | 'simulated_provider' | 'merchant_api';
}

export interface ActionRecord {
  actionId: string;
  idempotencyKey: string;
  userId: string;
  subscriptionId: string;
  subscriptionName: string;
  amount: number;
  decisionId: string;
  actionType: ActionType;
  guardrailResult: 'passed' | 'blocked' | 'requires_approval';
  timestamp: string;
  executionStatus: ExecutionStatus;
  verificationResult?: ActionVerification;
  errorInfo?: string;
  draftSubject?: string;
  draftBody?: string;
  simulated: boolean;
}

export type AuditSeverity = 'info' | 'warning' | 'alert' | 'success';

export interface AuditLog {
  id: string;
  userId: string;
  timestamp: string;
  eventType: 
    | 'SCAN_STARTED' 
    | 'SCAN_COMPLETED' 
    | 'SUBSCRIPTION_DETECTED' 
    | 'AI_ANALYSIS_COMPLETED' 
    | 'GUARDRAIL_EVALUATED' 
    | 'ACTION_TRIGGERED' 
    | 'ACTION_VERIFIED' 
    | 'ACTION_BLOCKED' 
    | 'USER_APPROVAL_REQUESTED' 
    | 'USER_ACTION_EXECUTED' 
    | 'GUARDRAILS_UPDATED' 
    | 'SAVINGS_RECORDED'
    | 'USER_LOGIN';
  entityId: string;
  entityType: 'subscription' | 'action' | 'decision' | 'guardrail' | 'scan' | 'system' | 'user' | 'connection' | 'payment_app';
  description: string;
  severity: AuditSeverity;
  metadata?: Record<string, any>;
}

export interface SavingsBreakdown {
  subscriptionId: string;
  name: string;
  monthlySavings: number;
  annualSavings: number;
  actionDate: string;
  verified: boolean;
  actionType: ActionType;
}

export interface SavingsReport {
  totalMonthlySpend: number;
  totalAnnualSpend: number;
  potentialMonthlySavings: number;
  potentialAnnualSavings: number;
  confirmedMonthlySavings: number;
  confirmedAnnualSavings: number;
  actionCount: number;
  savingsBreakdown: SavingsBreakdown[];
}

export interface ReviewQueueItem {
  id: string;
  userId: string;
  subscriptionId: string;
  subscriptionName: string;
  amount: number;
  currency?: string;
  category: string;
  reason: string;
  description?: string;
  suggestedAction?: string;
  potentialSavings?: number;
  duplicateOf?: string;
  overlappingSubscription?: {
    id: string;
    name: string;
    amount: number;
    currency?: string;
    daysSinceLastUsed?: number;
  };
  options?: Array<{
    action: 'CANCEL_THIS' | 'CANCEL_OTHER' | 'KEEP_BOTH' | 'DISMISS';
    label: string;
  }>;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface SimulatedEmail {
  id: string;
  date: string;
  sender: string;
  merchant: string;
  subject: string;
  snippet: string;
  category?: 'trial_ending' | 'price_increase' | 'renewal_notice' | 'cancellation_confirmed' | string;
  extractedData?: Record<string, any>;
  simulated?: boolean;
}

export interface UsageRecord {
  subscriptionId: string;
  lastLoginDate: string;
  daysSinceLastUsed: number;
  monthlyLogins: number;
  activeFeaturesUsed: number;
}

export interface ConnectionStatus {
  id: string;
  name: string;
  type: 'bank' | 'email' | 'merchant_api' | 'banking' | 'usage' | 'payment_app' | 'upi' | 'csv_statement';
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSync?: string;
  lastSyncTime?: string;
  itemCount: number;
  simulated?: boolean;
  appId?: string;
  permissions?: string[];
  mandatesCount?: number;
  providerIcon?: string;
}

export interface GuardianStats {
  recurringSpendMonthly: number;
  recurringSpendAnnual: number;
  potentialSavingsMonthly: number;
  potentialSavingsAnnual: number;
  confirmedSavingsMonthly: number;
  confirmedSavingsAnnual: number;
  subscriptionsDetected: number;
  unusedSubscriptions: number;
  duplicates: number;
  priceIncreases: number;
  pendingApprovals: number;
  completedActions: number;
  automationPaused: boolean;
  lastScanTime?: string;
}

export interface TestScenarioResult {
  testId: string;
  name: string;
  expectedResult: ActionType;
  actualResult: ActionType;
  passed: boolean;
  durationMs: number;
  decision: Decision;
  details: string;
}
