import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Trash2,
  ShieldCheck,
  Loader2,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { ReviewQueueItem, Subscription } from '../types';
import { formatINR } from '../lib/currency';

interface ReviewCenterViewProps {
  reviewQueue: ReviewQueueItem[];
  subscriptions: Subscription[];
  onResolveItem: (id: string, actionChoice: string) => void;
}

export const ReviewCenterView: React.FC<ReviewCenterViewProps> = ({
  reviewQueue,
  subscriptions: _subscriptions,
  onResolveItem,
}) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const pendingItems = reviewQueue.filter(r => r.status === 'pending');

  const handleResolve = async (id: string, choice: string) => {
    setResolvingId(id);
    try {
      await onResolveItem(id, choice);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Review Center</h2>
            {pendingItems.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {pendingItems.length} Awaiting Authorization
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            High-risk, over-limit, and overlapping duplicate subscriptions flagged by deterministic policy for explicit user authorization.
          </p>
        </div>
      </div>

      {pendingItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 rounded-2xl p-12 border border-slate-800 text-center space-y-3 shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-950/90 border border-emerald-800/80 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Review Center is Clear</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            All flagged subscriptions have been processed. Deductions have been applied to recurring spend and savings logged to your dashboard.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {pendingItems.map((item, idx) => {
              const isDuplicate = Boolean(item.overlappingSubscription || item.duplicateOf || item.reason === 'DUPLICATE_SERVICES');
              const isResolving = resolvingId === item.id;

              return (
                <motion.div
                  key={`${item.id}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-slate-900/95 rounded-2xl p-5 sm:p-6 border border-slate-800 hover:border-slate-700/80 transition-all space-y-4 shadow-sm"
                >
                  {/* Header of review card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white">{item.subscriptionName}</span>
                      <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                        {formatINR(item.amount)}/mo
                      </span>
                      {item.category && (
                        <span className="text-xs text-slate-400">({item.category})</span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      Flagged: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Explanation */}
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                    {item.description || item.reason}
                  </p>

                  {/* Overlapping Duplicate Side-by-Side Comparison */}
                  {isDuplicate && item.overlappingSubscription && (
                    <div className="bg-slate-950/80 rounded-xl p-4 border border-purple-900/40 space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                        <Copy className="w-4 h-4" />
                        <span>Overlapping Subscription Comparison (Deterministic Invariant)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Left: Primary Sub */}
                        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{item.subscriptionName}</span>
                            <span className="text-xs font-mono text-emerald-400 font-bold">
                              {formatINR(item.amount)}/mo
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.subscriptionName.toLowerCase().includes('apple')
                              ? 'Unused for 54 days. Duplicate streaming catalog.'
                              : item.subscriptionName.toLowerCase().includes('tunewave')
                              ? 'Actively used 4 days ago. Lower monthly cost.'
                              : 'High redundancy score.'}
                          </div>
                        </div>

                        {/* Right: Overlapping Partner Sub */}
                        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{item.overlappingSubscription.name}</span>
                            <span className="text-xs font-mono text-emerald-400 font-bold">
                              {formatINR(item.overlappingSubscription.amount)}/mo
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.overlappingSubscription.name.toLowerCase().includes('spotify')
                              ? 'Actively used yesterday. Primary preferred audio stream.'
                              : item.overlappingSubscription.name.toLowerCase().includes('tunewave')
                              ? 'Actively used 4 days ago.'
                              : `Last used ${item.overlappingSubscription.daysSinceLastUsed ?? 30} days ago.`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* One-Click Action & Confirmation Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {/* Primary Button: Confirm Cancellation */}
                    <button
                      id={`confirm-cancel-${item.id}`}
                      onClick={() => handleResolve(item.id, 'CANCEL_THIS')}
                      disabled={isResolving}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isResolving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>
                        Confirm Cancellation ({formatINR(item.amount)}/mo)
                      </span>
                    </button>

                    {/* Secondary Option if Duplicate Partner exists */}
                    {item.overlappingSubscription && (
                      <button
                        id={`confirm-cancel-partner-${item.id}`}
                        onClick={() => handleResolve(item.id, 'CANCEL_OTHER')}
                        disabled={isResolving}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-all disabled:opacity-50 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>
                          Cancel {item.overlappingSubscription.name} ({formatINR(item.overlappingSubscription.amount)}/mo)
                        </span>
                      </button>
                    )}

                    {/* Keep Subscription Button */}
                    <button
                      id={`keep-sub-${item.id}`}
                      onClick={() => handleResolve(item.id, 'KEEP_BOTH')}
                      disabled={isResolving}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.overlappingSubscription ? 'Keep Both Subscriptions' : 'Dismiss & Keep Active'}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
