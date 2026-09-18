import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, ScanResponse, SchedulerStatus, setApiAuthToken } from './api/client';
import {
  ActiveTab,
  GuardianStats,
  GuardrailConfig,
  Subscription,
  ActionRecord,
  AuditLog,
  ReviewQueueItem,
  DataSourceConnection,
} from './types';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { ScanView } from './components/ScanView';
import { ReviewCenterView } from './components/ReviewCenterView';
import { SavingsView } from './components/SavingsView';
import { GuardrailsView } from './components/GuardrailsView';
import { ExecutionAuditView } from './components/ExecutionAuditView';
import { AICommandCenterView } from './components/AICommandCenterView';
import { ConnectionsView } from './components/ConnectionsView';
import { SettingsView } from './components/SettingsView';
import { GmailPermissionModal } from './components/GmailPermissionModal';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';

function AppContent() {
  const { idToken, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [stats, setStats] = useState<GuardianStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [guardrails, setGuardrails] = useState<GuardrailConfig | null>(null);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [_scheduler, setScheduler] = useState<SchedulerStatus | null>(null);
  const [connections, setConnections] = useState<DataSourceConnection[]>([]);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  // Modals for Gmail permission & Firebase Authentication
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync Firebase ID token with API client
  useEffect(() => {
    setApiAuthToken(idToken);
  }, [idToken]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAllData = useCallback(async () => {
    try {
      const [
        statsData,
        subsData,
        guardrailsData,
        actionsData,
        auditData,
        reviewData,
        schedData,
        connsData,
      ] = await Promise.all([
        api.getStats(),
        api.getSubscriptions(),
        api.getGuardrails(),
        api.getActions(),
        api.getAuditLogs(),
        api.getReviewQueue(),
        api.getSchedulerStatus(),
        api.getConnections(),
      ]);

      setStats(statsData);
      setSubscriptions(subsData);
      setGuardrails(guardrailsData);
      setActions(actionsData);
      setAuditLogs(auditData);
      setReviewQueue(reviewData);
      setScheduler(schedData);
      setConnections(connsData);
    } catch (err) {
      console.error('Error loading Secure Money data:', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();

    // Background poll every 6s to pick up autonomous worker cycles
    const interval = setInterval(() => {
      loadAllData();
    }, 6000);

    return () => clearInterval(interval);
  }, [loadAllData]);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    showToast('Autonomous Secure Money scan running across all telemetry feeds...');
    try {
      const result = await api.triggerScan();
      setLastScanResult(result);
      await loadAllData();
      const actionsCount = result?.actions?.length ?? result?.autoActionsExecuted ?? 0;
      showToast(`Scan complete: ${actionsCount} autonomous action(s) evaluated.`);
    } catch (err) {
      console.error('Scan failed:', err);
      showToast('Scan encounter error. Please check server status.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateGuardrails = async (updated: Partial<GuardrailConfig>) => {
    try {
      const saved = await api.updateGuardrails(updated);
      setGuardrails(saved);
      showToast('Guardrail policies updated successfully.');
      await loadAllData();
    } catch (err) {
      console.error('Failed to update guardrails:', err);
    }
  };

  const handleExecuteSubAction = async (id: string, actionType: 'CANCEL' | 'DOWNGRADE' | 'KEEP') => {
    try {
      await api.executeSubAction(id, actionType);
      showToast(`Action ${actionType} executed with zero-knowledge cryptographic signature.`);
      await loadAllData();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const handleDeleteSub = async (id: string) => {
    try {
      await api.deleteSubscription(id);
      showToast('Subscription removed from tracking.');
      await loadAllData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleResolveReviewItem = async (id: string, actionChoice: string) => {
    try {
      await api.resolveReviewItem(id, actionChoice);
      showToast('Conflict resolved.');
      await loadAllData();
    } catch (err) {
      console.error('Resolve failed:', err);
    }
  };

  const handleToggleAutomation = async () => {
    if (!guardrails) return;
    const currentPaused = guardrails.pauseAutomation;
    await handleUpdateGuardrails({ pauseAutomation: !currentPaused });
  };

  const handleResetData = async () => {
    try {
      await api.resetData();
      await loadAllData();
      showToast('Secure Money database reset to initial seed state.');
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const handleSyncConnection = async (id: string) => {
    try {
      await api.syncConnection(id);
      showToast('Connector sync initiated.');
      await loadAllData();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleGmailScanSuccess = (count: number) => {
    showToast(`Gmail Inbox Ingestion complete: analyzed & indexed ${count} receipts.`);
    loadAllData();
  };

  const pendingReviewCount = reviewQueue.filter(r => r.status === 'pending').length;
  const activeSubCount = subscriptions.filter(s => s.status === 'active').length;
  const isPaused = guardrails?.pauseAutomation ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-pulse font-bold text-xl">
          ₹
        </div>
        <p className="text-xs font-mono text-slate-400">Loading Secure Money Invariant Enclave...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <div className={`flex min-h-screen bg-[#070D18] text-slate-100 ${theme === 'light' ? 'theme-light' : ''}`}>
      {/* Toast Notification Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-[#0F172A]/95 backdrop-blur-md border border-cyan-500/40 text-cyan-200 px-4 py-3 rounded-2xl shadow-2xl text-xs font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gmail Permission & Background Scan Dialog */}
      <GmailPermissionModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        onSuccess={handleGmailScanSuccess}
      />

      {/* Firebase Authentication Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingReviewCount={pendingReviewCount}
        activeSubCount={activeSubCount}
        automationPaused={isPaused}
        onToggleAutomation={handleToggleAutomation}
        theme={theme}
        onThemeChange={setTheme}
        onOpenGmailPermission={() => setIsGmailModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Right Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <Header
          stats={stats}
          guardrails={guardrails}
          isScanning={isScanning}
          onTriggerScan={handleTriggerScan}
          onResetData={handleResetData}
          onNavigateToGuardrails={() => setActiveTab('guardrails')}
          onOpenGmailPermission={() => setIsGmailModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic View Canvas with Smooth Transitions */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'overview' && (
                <OverviewView
                  stats={stats}
                  guardrails={guardrails}
                  subscriptions={subscriptions}
                  onNavigate={setActiveTab}
                  onTriggerScan={handleTriggerScan}
                  onUpdateGuardrails={handleUpdateGuardrails}
                  onExecuteAction={handleExecuteSubAction}
                />
              )}

              {activeTab === 'subscriptions' && (
                <SubscriptionsView
                  subscriptions={subscriptions}
                  guardrails={guardrails}
                  onExecuteAction={handleExecuteSubAction}
                  onDeleteSub={handleDeleteSub}
                />
              )}

              {activeTab === 'scan' && (
                <ScanView
                  subscriptions={subscriptions}
                  guardrails={guardrails}
                  lastScanResult={lastScanResult}
                  isScanning={isScanning}
                  onTriggerScan={handleTriggerScan}
                />
              )}

              {activeTab === 'review' && (
                <ReviewCenterView
                  reviewQueue={reviewQueue}
                  subscriptions={subscriptions}
                  onResolveItem={handleResolveReviewItem}
                />
              )}

              {activeTab === 'savings' && (
                <SavingsView stats={stats} actions={actions} />
              )}

              {activeTab === 'guardrails' && (
                <GuardrailsView
                  guardrails={guardrails}
                  onUpdateGuardrails={handleUpdateGuardrails}
                />
              )}

              {activeTab === 'audit' && (
                <ExecutionAuditView actions={actions} auditLogs={auditLogs} />
              )}

              {activeTab === 'command' && (
                <AICommandCenterView onRefreshState={loadAllData} />
              )}

              {activeTab === 'connections' && (
                <ConnectionsView
                  connections={connections}
                  onRefresh={loadAllData}
                  onOpenGmailPermission={() => setIsGmailModalOpen(true)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  connections={connections}
                  onSyncConnection={handleSyncConnection}
                  onResetData={handleResetData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
