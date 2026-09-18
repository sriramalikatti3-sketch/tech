import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Zap,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { ConnectionStatus } from '../types';

interface SettingsViewProps {
  connections: ConnectionStatus[];
  onSyncConnection: (id: string) => Promise<void>;
  onResetData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  connections,
  onSyncConnection,
  onResetData,
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await onSyncConnection(id);
    } finally {
      setTimeout(() => setSyncingId(null), 1200);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all subscriptions, actions, and guardrails to initial benchmark seed state?')) {
      return;
    }
    setIsResetting(true);
    try {
      await onResetData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          Data Connections &amp; Simulation Environment
        </h2>
        <p className="text-xs text-slate-400">
          Connect your financial feeds, mailbox signals, and direct merchant APIs for continuous telemetry ingestion.
        </p>
      </div>

      {/* Connected Ingestion Feeds */}
      <div className="space-y-3">
        {connections.map(conn => {
          const isSyncing = syncingId === conn.id || conn.status === 'syncing';
          const Icon = conn.type === 'bank' ? Building2 : conn.type === 'email' ? Mail : Zap;

          return (
            <div
              key={conn.id}
              className="bg-slate-900 rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-emerald-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{conn.name}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {conn.status}
                    </span>
                    {conn.simulated && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Demo Sandbox Feed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {conn.itemCount} telemetry records ingested • Last synced: {new Date(conn.lastSync || conn.lastSyncTime || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSync(conn.id)}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Reset Demo Data Card */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-start space-x-3">
          <RotateCcw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white">Reset Demo Benchmark Data</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Restores initial seeded subscriptions (StreamFlix, TuneWave, MusicBox Premium, HealthGuard Insurance), default guardrails (₹1,500 limit, protected insurance), and clears action history.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center space-x-3">
          <button
            id="settings-reset-seed-btn"
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting Database...' : 'Reset All to Initial Demo State'}</span>
          </button>

          {resetSuccess && (
            <span className="text-xs text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Database reset to benchmark state!</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
