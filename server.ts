import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { store } from './backend/db/store.js';
import { guardianService } from './backend/services/guardianService.js';
import { backgroundScheduler } from './backend/jobs/scheduler.js';
import { geminiAgent } from './backend/agents/geminiAgent.js';
import { actionEngine } from './backend/actions/actionEngine.js';
import { runAllTests } from './backend/tests/testRunner.js';
import { authenticateFirebaseUser } from './backend/auth.js';
import { gmailIngestionService } from './backend/services/gmailIngestionService.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(authenticateFirebaseUser);

// ==========================================
// REST API SERVICE LAYER
// ==========================================

function getUserId(req: Request): string {
  const headerUser = (req.headers['x-user-id'] as string)?.trim();
  if (headerUser) return headerUser;
  return req.user?.email || req.user?.uid || 'openings.1309@gmail.com';
}

// Auth Status
app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getUserId(req);
  res.json({
    user: req.user || {
      uid: userId,
      email: userId.includes('@') ? userId : `${userId}@gmail.com`,
      name: userId.includes('@') ? userId.split('@')[0] : userId,
    },
    authenticated: true,
  });
});

// Health & System Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Secure Money Autonomous Backend Engine',
    timestamp: new Date().toISOString(),
    scheduler: backgroundScheduler.getStatus(),
    user: req.user,
  });
});

// Stats & Dashboard
app.get('/api/stats', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const stats = store.getStats(userId);
  res.json(stats);
});

// Subscriptions
app.get('/api/subscriptions', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const subs = store.getSubscriptions(userId);
  res.json(subs);
});

app.get('/api/subscriptions/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const sub = store.getSubscription(req.params.id, userId);
  if (!sub) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }
  res.json(sub);
});

app.post('/api/subscriptions/:id/action', async (req: Request, res: Response) => {
  try {
    const { actionType } = req.body;
    if (!actionType || !['CANCEL', 'DOWNGRADE', 'KEEP'].includes(actionType)) {
      res.status(400).json({ error: 'Valid actionType (CANCEL, DOWNGRADE, KEEP) required' });
      return;
    }
    const result = await actionEngine.executeUserApprovedAction(req.params.id, actionType);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subscriptions/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const success = store.deleteSubscription(req.params.id, userId);
  if (success) {
    store.addAuditLog({
      userId,
      eventType: 'GUARDRAILS_UPDATED',
      entityId: req.params.id,
      entityType: 'subscription',
      description: `Subscription ${req.params.id} removed from tracking.`,
      severity: 'info',
      metadata: { subscriptionId: req.params.id },
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Subscription not found' });
  }
});

// Guardrails
app.get('/api/guardrails', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const config = store.getGuardrails(userId);
  res.json(config);
});

app.put('/api/guardrails', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const updated = store.updateGuardrails(req.body, userId);
  store.addAuditLog({
    userId,
    eventType: 'GUARDRAILS_UPDATED',
    entityId: 'guardrail_config',
    entityType: 'guardrail',
    description: `Guardrail settings updated. Max auto limit: ₹${updated.maxAutoAmount}, Pause: ${updated.pauseAutomation}.`,
    severity: 'warning',
    metadata: updated,
  });
  res.json(updated);
});

// Actions & Execution Audit
app.get('/api/actions', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const actions = store.getActions(userId);
  res.json(actions);
});

// Immutable Audit Log
app.get('/api/audit', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const logs = store.getAuditLogs(userId);
  res.json(logs);
});

// Review Center Queue
app.get('/api/review', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const queue = store.getReviewQueue(userId);
  res.json(queue);
});

app.post('/api/review/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { actionChoice } = req.body;
    const userId = getUserId(req);
    const item = store.getReviewQueueItem(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Review item not found' });
      return;
    }

    if (actionChoice === 'CANCEL_THIS' || actionChoice === 'CANCEL') {
      const action = await actionEngine.executeUserApprovedAction(item.subscriptionId, 'CANCEL', item.id);
      res.json({
        success: true,
        action,
        stats: store.getStats(userId),
        subscriptions: store.getSubscriptions(userId),
        reviewQueue: store.getReviewQueue(userId),
      });
    } else if (actionChoice === 'CANCEL_OTHER' && item.overlappingSubscription) {
      const action = await actionEngine.executeUserApprovedAction(item.overlappingSubscription.id, 'CANCEL', item.id);
      res.json({
        success: true,
        action,
        stats: store.getStats(userId),
        subscriptions: store.getSubscriptions(userId),
        reviewQueue: store.getReviewQueue(userId),
      });
    } else if (actionChoice === 'DOWNGRADE') {
      const action = await actionEngine.executeUserApprovedAction(item.subscriptionId, 'DOWNGRADE', item.id);
      res.json({
        success: true,
        action,
        stats: store.getStats(userId),
        subscriptions: store.getSubscriptions(userId),
        reviewQueue: store.getReviewQueue(userId),
      });
    } else {
      item.status = 'resolved';
      item.resolvedAt = new Date().toISOString();
      item.resolutionNote = actionChoice === 'KEEP_BOTH' ? 'User chose to keep both' : 'Dismissed';
      store.saveReviewQueueItem(item);
      res.json({
        success: true,
        item,
        stats: store.getStats(userId),
        subscriptions: store.getSubscriptions(userId),
        reviewQueue: store.getReviewQueue(userId),
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Savings Report
app.get('/api/savings', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const report = guardianService.getSavingsReport(userId);
  res.json(report);
});

// Trigger Scan
app.post('/api/scan/trigger', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const result = await guardianService.runAutonomousScan(userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Scheduler Status & Control
app.get('/api/scheduler', (req: Request, res: Response) => {
  res.json(backgroundScheduler.getStatus());
});

app.post('/api/scheduler/toggle', (req: Request, res: Response) => {
  const current = backgroundScheduler.getStatus();
  if (current.isRunning) {
    backgroundScheduler.stop();
  } else {
    backgroundScheduler.start();
  }
  res.json(backgroundScheduler.getStatus());
});

// AI Command Center
app.post('/api/command', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    if (!command) {
      res.status(400).json({ error: 'Command string is required' });
      return;
    }

    const userId = getUserId(req);
    const subscriptions = store.getSubscriptions(userId);
    const guardrails = store.getGuardrails(userId);
    const stats = store.getStats(userId);
    const recentActions = store.getActions(userId);

    const response = await geminiAgent.processCommand(command, {
      subscriptions,
      guardrails,
      stats,
      recentActions,
    });

    // If command requested pausing automation
    if (response.suggestedAction?.type === 'PAUSE_AUTOMATION') {
      store.updateGuardrails({ pauseAutomation: response.suggestedAction.payload.pause }, userId);
    }

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Connectors & Data Feeds
app.get('/api/connections', (req: Request, res: Response) => {
  res.json(store.getConnections());
});

// Upload Bank Statement CSV
app.post('/api/connections/upload-csv', async (req: Request, res: Response) => {
  try {
    const { records, bankName } = req.body;
    if (!Array.isArray(records)) {
      res.status(400).json({ error: 'records array is required' });
      return;
    }
    const userId = getUserId(req);
    const result = store.importBankStatementCsv(userId, records, bankName || 'Bank Statement');
    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Payment App Permissions (PhonePe, G-Pay, Paytm, CRED)
app.post('/api/connections/toggle-payment-app', async (req: Request, res: Response) => {
  try {
    const { appId, enabled, permissions } = req.body;
    if (!appId) {
      res.status(400).json({ error: 'appId is required' });
      return;
    }
    const userId = getUserId(req);
    const updated = store.togglePaymentAppPermission(userId, appId, enabled ?? true, permissions || []);
    res.json({
      success: true,
      connection: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest real Gmail transaction & receipt messages
app.post('/api/ingest/gmail', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const userId = req.user?.uid || 'user_guardian_default';
    const result = gmailIngestionService.processGmailMessages(userId, messages);
    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Background Worker Controls
app.get('/api/background/status', (req: Request, res: Response) => {
  res.json(backgroundScheduler.getStatus());
});

app.post('/api/background/toggle', (req: Request, res: Response) => {
  const current = backgroundScheduler.getStatus();
  if (current.isRunning) {
    backgroundScheduler.stop();
  } else {
    backgroundScheduler.start();
  }
  res.json(backgroundScheduler.getStatus());
});

app.post('/api/connections/:id/sync', async (req: Request, res: Response) => {
  store.updateConnection(req.params.id, {
    status: 'syncing',
  });

  setTimeout(() => {
    store.updateConnection(req.params.id, {
      status: 'connected',
      lastSync: new Date().toISOString(),
    });
  }, 1000);

  res.json({ success: true, message: 'Sync started' });
});

app.get('/api/transactions', (req: Request, res: Response) => {
  res.json(store.getTransactions());
});

app.get('/api/emails', (req: Request, res: Response) => {
  res.json(store.getEmails());
});

// Reset Demo Data
app.post('/api/reset-data', (req: Request, res: Response) => {
  store.resetToSeed();
  res.json({ success: true, message: 'Database reset to initial demo state' });
});

// Run Backend Automated Test Suite
app.post('/api/tests/run', async (req: Request, res: Response) => {
  try {
    const testSuiteResult = await runAllTests();
    res.json(testSuiteResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// VITE MIDDLEWARE & SPA SERVING
// ==========================================
async function start() {
  // Start autonomous background scheduler
  backgroundScheduler.start();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Secure Money] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
