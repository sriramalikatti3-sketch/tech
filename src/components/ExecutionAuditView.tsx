import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Clock,
  Key,
  Receipt,
  Search,
} from 'lucide-react';
import { ActionRecord, AuditLog } from '../types';

interface ExecutionAuditViewProps {
  actions: ActionRecord[];
  auditLogs: AuditLog[];
}

export const ExecutionAuditView: React.FC<ExecutionAuditViewProps> = ({
  actions,
  auditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'audit'>('actions');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredActions = actions.filter(a => {
    const matchesFilter = filterStatus === 'all' || a.executionStatus === filterStatus;
    const matchesSearch =
      a.subscriptionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.actionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.idempotencyKey.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredLogs = auditLogs.filter(l => {
    return (
      l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.eventType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Execution &amp; Verification Audit Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Immutable trace of every decision, guardrail evaluation, and cryptographic merchant verification proof.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'actions'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Action Records ({actions.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'audit'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Full Audit Stream ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search records or idempotency keys..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {activeTab === 'actions' && (
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Execution States</option>
            <option value="verified">Verified Proof Only</option>
            <option value="completed">Completed / Approved</option>
            <option value="blocked">Blocked by Policy</option>
            <option value="failed">Execution Failed</option>
          </select>
        )}
      </div>

      {/* Main Content */}
      {activeTab === 'actions' ? (
        <div className="space-y-3">
          {filteredActions.length === 0 ? (
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 text-center text-xs text-slate-400">
              No actions match the criteria. Run a Guardian scan to generate autonomous actions.
            </div>
          ) : (
            filteredActions.map(action => {
              const isVerified = action.executionStatus === 'verified';
              const isBlocked = action.executionStatus === 'blocked';

              return (
                <div
                  key={action.actionId}
                  className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isVerified
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : isBlocked
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {isVerified ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isBlocked ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <span className="text-sm font-bold text-white">{action.subscriptionName}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          Action: <strong className="text-slate-200">{action.actionType}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isVerified
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isBlocked
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Status: {action.executionStatus}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Verification Proof & Merchant Response */}
                  {action.verificationResult && (
                    <div className="bg-slate-950 rounded-lg p-3.5 border border-emerald-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Cryptographic Verification Proof</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                          Token: {action.verificationResult.merchantConfirmationCode}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 leading-relaxed">
                        {action.verificationResult.merchantResponse}
                      </p>
                    </div>
                  )}

                  {/* Error Info or Policy Block Detail */}
                  {action.errorInfo && (
                    <div className="bg-rose-950/30 border border-rose-900/60 p-3 rounded-lg text-xs text-rose-300">
                      <strong>Guardrail / Error Detail: </strong>
                      <span>{action.errorInfo}</span>
                    </div>
                  )}

                  {/* Idempotency & Metadata Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-1">
                    <span>Action ID: {action.actionId}</span>
                    <span className="flex items-center space-x-1">
                      <Key className="w-3 h-3 text-slate-500" />
                      <span>Idempotency: {action.idempotencyKey}</span>
                    </span>
                    <span>Decision ID: {action.decisionId}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Full Audit Log Stream */
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-4 space-y-1 hover:bg-slate-850 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  [{log.eventType}]
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{log.description}</p>
              <div className="text-[10px] font-mono text-slate-500">
                Entity: {log.entityType} ({log.entityId})
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
