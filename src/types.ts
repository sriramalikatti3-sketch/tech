import type {
  BillingCycle,
  SubscriptionStatus,
  RiskLevel,
  ActionType,
  ExecutionStatus,
  Subscription,
  GuardrailConfig,
  ActionVerification,
  ActionRecord,
  AuditLog,
  ReviewQueueItem,
  Transaction,
  SimulatedEmail,
  ConnectionStatus,
  GuardianStats,
  SavingsReport,
  SavingsBreakdown,
  TestScenarioResult,
  Decision,
} from '../backend/models/types.js';

export type {
  BillingCycle,
  SubscriptionStatus,
  RiskLevel,
  ActionType,
  ExecutionStatus,
  Subscription,
  GuardrailConfig,
  ActionVerification,
  ActionRecord,
  AuditLog,
  ReviewQueueItem,
  Transaction,
  SimulatedEmail,
  ConnectionStatus,
  GuardianStats,
  SavingsReport,
  SavingsBreakdown,
  TestScenarioResult,
  Decision,
};

export type DataSourceConnection = ConnectionStatus;

export type ActiveTab =
  | 'overview'
  | 'subscriptions'
  | 'scan'
  | 'review'
  | 'savings'
  | 'audit'
  | 'command'
  | 'guardrails'
  | 'connections'
  | 'tests'
  | 'settings';
