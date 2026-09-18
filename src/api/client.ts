import {
  GuardianStats,
  Subscription,
  GuardrailConfig,
  ActionRecord,
  AuditLog,
  ReviewQueueItem,
  SavingsReport,
  ConnectionStatus,
  TestScenarioResult,
} from '../types';

export interface ScanTelemetryStep {
  step: string;
  details: string;
  durationMs: number;
}

export interface ScanResponse {
  totalProcessed: number;
  autoActionsExecuted: number;
  approvalsRequested: number;
  blockedByGuardrails: number;
  durationMs: number;
  actions: ActionRecord[];
  telemetry?: ScanTelemetryStep[];
}

export interface SchedulerStatus {
  isRunning: boolean;
  intervalSeconds: number;
  lastRunTime: string | null;
  nextRunTime: string | null;
  history: Array<{
    jobId: string;
    name: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    status: 'success' | 'failed';
    resultSummary: string;
  }>;
}

export interface CommandResponse {
  message: string;
  suggestedAction?: {
    type: string;
    payload?: any;
  };
  matchedSubscriptions?: string[];
}

export interface TestSuiteResponse {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: TestScenarioResult[];
}

let currentAuthToken: string | null = null;
let currentUserId: string = localStorage.getItem('guardian_active_user_id') || 'openings.1309@gmail.com';

export function setApiAuthToken(token: string | null) {
  currentAuthToken = token;
}

export function getActiveUserId(): string {
  return currentUserId;
}

export function setActiveUserId(userId: string) {
  currentUserId = userId;
  localStorage.setItem('guardian_active_user_id', userId);
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (currentAuthToken) {
    headers.set('Authorization', `Bearer ${currentAuthToken}`);
  }
  if (currentUserId) {
    headers.set('x-user-id', currentUserId);
  }
  return fetch(url, { ...options, headers });
}

export const api = {
  async getAuthMe() {
    const res = await authFetch('/api/auth/me');
    return res.json();
  },

  async getHealth() {
    const res = await authFetch('/api/health');
    return res.json();
  },

  async getStats(): Promise<GuardianStats> {
    const res = await authFetch('/api/stats');
    return res.json();
  },

  async getSubscriptions(): Promise<Subscription[]> {
    const res = await authFetch('/api/subscriptions');
    return res.json();
  },

  async getSubscription(id: string): Promise<Subscription> {
    const res = await authFetch(`/api/subscriptions/${id}`);
    return res.json();
  },

  async executeSubAction(id: string, actionType: 'CANCEL' | 'DOWNGRADE' | 'KEEP'): Promise<ActionRecord> {
    const res = await authFetch(`/api/subscriptions/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType }),
    });
    return res.json();
  },

  async deleteSubscription(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getGuardrails(): Promise<GuardrailConfig> {
    const res = await authFetch('/api/guardrails');
    return res.json();
  },

  async updateGuardrails(config: Partial<GuardrailConfig>): Promise<GuardrailConfig> {
    const res = await authFetch('/api/guardrails', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async getActions(): Promise<ActionRecord[]> {
    const res = await authFetch('/api/actions');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await authFetch('/api/audit');
    return res.json();
  },

  async getReviewQueue(): Promise<ReviewQueueItem[]> {
    const res = await authFetch('/api/review');
    return res.json();
  },

  async resolveReviewItem(id: string, actionChoice: string): Promise<any> {
    const res = await authFetch(`/api/review/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionChoice }),
    });
    return res.json();
  },

  async getSavingsReport(): Promise<SavingsReport> {
    const res = await authFetch('/api/savings');
    return res.json();
  },

  async triggerScan(): Promise<ScanResponse> {
    const res = await authFetch('/api/scan/trigger', { method: 'POST' });
    return res.json();
  },

  async getSchedulerStatus(): Promise<SchedulerStatus> {
    const res = await authFetch('/api/scheduler');
    return res.json();
  },

  async toggleScheduler(): Promise<SchedulerStatus> {
    const res = await authFetch('/api/scheduler/toggle', { method: 'POST' });
    return res.json();
  },

  async getBackgroundStatus(): Promise<SchedulerStatus> {
    const res = await authFetch('/api/background/status');
    return res.json();
  },

  async toggleBackground(): Promise<SchedulerStatus> {
    const res = await authFetch('/api/background/toggle', { method: 'POST' });
    return res.json();
  },

  async sendCommand(command: string): Promise<CommandResponse> {
    const res = await authFetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    return res.json();
  },

  async getConnections(): Promise<ConnectionStatus[]> {
    const res = await authFetch('/api/connections');
    return res.json();
  },

  async syncConnection(id: string): Promise<any> {
    const res = await authFetch(`/api/connections/${id}/sync`, { method: 'POST' });
    return res.json();
  },

  async uploadCsvStatements(records: any[], bankName = 'HDFC Bank Statement'): Promise<any> {
    const res = await authFetch('/api/connections/upload-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, bankName }),
    });
    return res.json();
  },

  async togglePaymentApp(appId: string, enabled: boolean, permissions: string[]): Promise<any> {
    const res = await authFetch('/api/connections/toggle-payment-app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, enabled, permissions }),
    });
    return res.json();
  },

  async ingestGmail(messages: any[]): Promise<any> {
    const res = await authFetch('/api/ingest/gmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    return res.json();
  },

  async resetData(): Promise<any> {
    const res = await authFetch('/api/reset-data', { method: 'POST' });
    return res.json();
  },

  async runTests(): Promise<TestSuiteResponse> {
    const res = await authFetch('/api/tests/run', { method: 'POST' });
    return res.json();
  },
};
