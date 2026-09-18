import { guardianService, ScanRunResult } from '../services/guardianService.js';
import { store } from '../db/store.js';

export interface JobHistoryEntry {
  jobId: string;
  name: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'success' | 'failed';
  resultSummary: string;
}

export class BackgroundScheduler {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs = 60 * 1000; // 60 seconds background cycle
  private isRunning = false;
  private jobHistory: JobHistoryEntry[] = [];
  private lastRunTime?: string;
  private nextRunTime?: string;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Guardian Scheduler] Autonomous background worker started (interval: ${this.intervalMs / 1000}s)`);

    this.scheduleNext();
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[Guardian Scheduler] Background worker stopped');
  }

  private scheduleNext() {
    if (!this.isRunning) return;

    this.nextRunTime = new Date(Date.now() + this.intervalMs).toISOString();

    this.timer = setTimeout(async () => {
      await this.runJob();
      this.scheduleNext();
    }, this.intervalMs);
  }

  async runJob(): Promise<ScanRunResult | null> {
    const guardrails = store.getGuardrails();
    if (guardrails.pauseAutomation) {
      console.log('[Guardian Scheduler] Automation paused by user guardrail. Skipping scheduled execution.');
      return null;
    }

    const jobId = `job_${Date.now()}`;
    const startedAt = new Date().toISOString();
    const t0 = Date.now();

    try {
      console.log(`[Guardian Scheduler] Executing autonomous cycle #${this.jobHistory.length + 1}...`);
      const result = await guardianService.runAutonomousScan();
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - t0;

      this.lastRunTime = completedAt;
      this.jobHistory.unshift({
        jobId,
        name: 'Periodic Guardian Ingestion & Evaluation',
        startedAt,
        completedAt,
        durationMs,
        status: 'success',
        resultSummary: `Scanned ${result.subscriptionsAnalyzed} subs. ${result.autoActionsExecuted} auto-actions, ${result.approvalsRequested} approvals, ${result.blockedByGuardrails} blocked.`,
      });

      if (this.jobHistory.length > 50) {
        this.jobHistory = this.jobHistory.slice(0, 50);
      }

      return result;
    } catch (err: any) {
      console.error('[Guardian Scheduler] Job execution error:', err);
      this.jobHistory.unshift({
        jobId,
        name: 'Periodic Guardian Ingestion & Evaluation',
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - t0,
        status: 'failed',
        resultSummary: `Error: ${err.message}`,
      });
      return null;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalSeconds: this.intervalMs / 1000,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.nextRunTime,
      totalRuns: this.jobHistory.length,
      history: this.jobHistory.slice(0, 10),
    };
  }

  setIntervalSeconds(seconds: number) {
    this.intervalMs = Math.max(10, seconds) * 1000;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

export const backgroundScheduler = new BackgroundScheduler();
