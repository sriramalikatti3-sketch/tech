import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ArrowDownCircle,
  HelpCircle,
  Copy,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Subscription, GuardrailConfig } from '../types';
import { formatINR } from '../lib/currency';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  guardrails: GuardrailConfig | null;
  onExecuteAction: (id: string, actionType: 'CANCEL' | 'DOWNGRADE' | 'KEEP') => void;
  onDeleteSub: (id: string) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  subscriptions,
  guardrails,
  onExecuteAction,
  onDeleteSub,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(subscriptions.map(s => s.category)))];

  const filtered = subscriptions.filter(sub => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sub.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAction = async (id: string, actionType: 'CANCEL' | 'DOWNGRADE' | 'KEEP') => {
    setActionInProgress(`${id}_${actionType}`);
    try {
      await onExecuteAction(id, actionType);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Active Subscriptions Telemetry</h2>
          <p className="text-xs text-slate-400">
            Real-time tracking of recurring billings, usage telemetry, and AI waste assessments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter subscriptions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-64"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscription Cards / List */}
      <div className="space-y-3">
        {filtered.map((sub, idx) => {
          const isExpanded = expandedSubId === sub.id;
          const isInsurance = guardrails?.protectedCategories.some(c =>
            sub.category.toLowerCase().includes(c.toLowerCase())
          );
          const isDuplicate = Boolean(sub.duplicateGroup);
          const isCancelled = sub.status === 'cancelled';

          return (
            <div
              key={`${sub.id}-${idx}`}
              className={`bg-slate-900 rounded-xl border transition-all ${
                isCancelled
                  ? 'border-slate-800/50 opacity-60'
                  : isExpanded
                  ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Identity & Badges */}
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 font-bold text-slate-300 text-sm">
                    {sub.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-sm font-bold text-white">{sub.name}</span>
                      <span className="text-xs text-slate-400">({sub.merchant})</span>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        {sub.status}
                      </span>

                      {/* Case Badges */}
                      {sub.id === 'sub_streamflix' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                          Case 1: Auto Target
                        </span>
                      )}
                      {isDuplicate && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 flex items-center space-x-1">
                          <Copy className="w-3 h-3" />
                          <span>Case 2: Duplicate Overlap</span>
                        </span>
                      )}
                      {isInsurance && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 flex items-center space-x-1">
                          <Shield className="w-3 h-3 text-rose-400" />
                          <span>Case 3: Protected Invariant</span>
                        </span>
                      )}
                      {sub.isPriceIncrease && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Price Increased</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span>Category: <strong className="text-slate-300">{sub.category}</strong></span>
                      <span>•</span>
                      <span>Last Used: <strong className={sub.daysSinceLastUsed > 90 ? 'text-amber-400' : 'text-slate-300'}>{sub.daysSinceLastUsed} days ago</strong></span>
                      <span>•</span>
                      <span>Billing: <strong className="text-slate-300">{formatINR(sub.amount)}/{sub.billingCycle}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Waste & Risk Meters */}
                <div className="flex items-center space-x-6">
                  {/* Waste Score Bar */}
                  <div className="w-28 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Waste:</span>
                      <span className={`font-bold ${sub.wasteScore > 75 ? 'text-rose-400' : sub.wasteScore > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {sub.wasteScore}/100
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          sub.wasteScore > 75 ? 'bg-rose-500' : sub.wasteScore > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${sub.wasteScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block">Risk</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        sub.riskLevel === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : sub.riskLevel === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {sub.riskLevel}
                    </span>
                  </div>

                  {/* Manual Action Buttons */}
                  {!isCancelled && (
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleAction(sub.id, 'CANCEL')}
                        disabled={actionInProgress !== null}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition-colors disabled:opacity-50"
                        title="Cancel this subscription via verified merchant connector"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={() => handleAction(sub.id, 'DOWNGRADE')}
                        disabled={actionInProgress !== null}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
                        title="Downgrade to basic tier"
                      >
                        Downgrade
                      </button>
                    </div>
                  )}

                  {/* Expand / Details Toggle */}
                  <button
                    onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Evidence & AI Analysis Drawer */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 rounded-b-xl space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini AI Synthesis &amp; Factual Evidence</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    {sub.analysisReasoning || 'Dormant subscription detected with recurring invoices.'}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Ground Truth Telemetry Signals:
                    </span>
                    <ul className="space-y-1">
                      {sub.evidence.map((ev, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start space-x-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800">
                    <span>AI Confidence: <strong className="text-slate-300">{sub.confidenceScore}%</strong></span>
                    <span>First Seen: {sub.firstSeenDate}</span>
                    <button
                      onClick={() => onDeleteSub(sub.id)}
                      className="text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove from tracking</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
