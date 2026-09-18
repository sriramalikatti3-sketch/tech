import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  IndianRupee,
  PiggyBank,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Copy,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Send,
  X,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  GuardianStats,
  GuardrailConfig,
  ActiveTab,
  Subscription,
} from '../types';
import { api } from '../api/client';

interface OverviewViewProps {
  stats: GuardianStats | null;
  guardrails: GuardrailConfig | null;
  subscriptions: Subscription[];
  onNavigate: (tab: ActiveTab) => void;
  onTriggerScan: () => void;
  onUpdateGuardrails: (updated: Partial<GuardrailConfig>) => void;
  onExecuteAction: (id: string, actionType: 'CANCEL' | 'DOWNGRADE' | 'KEEP') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  guardrails,
  subscriptions,
  onNavigate,
  onTriggerScan: _onTriggerScan,
  onUpdateGuardrails,
  onExecuteAction,
}) => {
  // Chart period state
  const [chartPeriod, setChartPeriod] = useState<'3M' | '6M' | '1Y'>('6M');
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // AI Command widget state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDismissed, setAiDismissed] = useState(false);

  // Selected subscription for detail modal
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  // Dynamic reactive stats calculated from actual subscriptions
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled');

  const displaySpend = subscriptions.length > 0
    ? activeSubs.reduce((acc, s) => acc + s.amount, 0)
    : (stats?.recurringSpendMonthly ?? 5497.00);

  const displayPotentialSavings = subscriptions.length > 0
    ? activeSubs.filter(s => s.wasteScore >= 60).reduce((acc, s) => acc + s.amount, 0)
    : (stats?.potentialSavingsMonthly ?? 1887.00);

  const displayConfirmedSavings = subscriptions.length > 0
    ? (cancelledSubs.reduce((acc, s) => acc + s.amount, 0) + (stats?.confirmedSavingsMonthly ?? 0))
    : (stats?.confirmedSavingsMonthly ?? 798.00);

  const displayDetected = activeSubs.length > 0 ? activeSubs.length : (stats?.subscriptionsDetected ?? 16);

  const unusedCount = subscriptions.length > 0
    ? activeSubs.filter(s => s.daysSinceLastUsed > 45).length
    : (stats?.unusedSubscriptions ?? 3);

  const duplicateCount = subscriptions.length > 0
    ? activeSubs.filter(s => s.duplicateGroup || (s.overlappingWith && s.overlappingWith.length > 0)).length
    : (stats?.duplicates ?? 2);

  const priceIncreaseCount = subscriptions.length > 0
    ? activeSubs.filter(s => s.isPriceIncrease).length
    : (stats?.priceIncreases ?? 2);

  const pendingApprovalsCount = stats?.pendingApprovals ?? 3;
  const completedActionsCount = (stats?.completedActions ?? 0) + cancelledSubs.length;

  const isAutomationPaused = guardrails?.pauseAutomation ?? false;

  // Chart data for Last 6 Months (Nov, Dec, Jan, Feb, Mar, Apr) in INR
  const totalCancelledSpend = cancelledSubs.reduce((acc, s) => acc + s.amount, 0);
  const chartData6M = [
    { month: 'Nov', spend: displaySpend + 1200, afterSavings: displaySpend + 400 },
    { month: 'Dec', spend: displaySpend + 1950, afterSavings: displaySpend + 600 },
    { month: 'Jan', spend: displaySpend + 1400, afterSavings: displaySpend + 450 },
    { month: 'Feb', spend: displaySpend + 2300, afterSavings: displaySpend + 900 },
    { month: 'Mar', spend: displaySpend + 1600, afterSavings: displaySpend + 300 },
    { month: 'Apr', spend: displaySpend + totalCancelledSpend, afterSavings: displaySpend },
  ];

  const chartData = chartPeriod === '3M'
    ? chartData6M.slice(3)
    : chartData6M;

  // Dynamic Category Breakdown from active subscriptions
  const categoryColorPalette: Record<string, string> = {
    'Entertainment': '#8b5cf6',
    'Productivity': '#3b82f6',
    'Software': '#06b6d4',
    'Music': '#ec4899',
    'Cloud Storage': '#0ea5e9',
    'Health & Fitness': '#10b981',
    'Gaming': '#f59e0b',
    'Shopping': '#f97316',
    'Insurance': '#a855f7',
    'AI / Developer Tools': '#6366f1',
    'Finance': '#14b8a6',
    'Education': '#eab308',
  };

  const dynamicCategoryMap: Record<string, { amount: number; count: number; color: string }> = {};
  activeSubs.forEach(s => {
    const cat = s.category || 'Other';
    if (!dynamicCategoryMap[cat]) {
      dynamicCategoryMap[cat] = {
        amount: 0,
        count: 0,
        color: categoryColorPalette[cat] || '#64748b',
      };
    }
    dynamicCategoryMap[cat].amount += s.amount;
    dynamicCategoryMap[cat].count += 1;
  });

  const totalCatAmount = Object.values(dynamicCategoryMap).reduce((sum, c) => sum + c.amount, 0) || 1;
  const categories = Object.keys(dynamicCategoryMap).length > 0
    ? Object.entries(dynamicCategoryMap)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 6)
        .map(([name, data]) => ({
          name,
          percentage: Math.max(1, Math.round((data.amount / totalCatAmount) * 100)),
          color: data.color,
          amount: `₹${Math.round(data.amount).toLocaleString('en-IN')}`,
          count: data.count,
        }))
    : [
        { name: 'Entertainment', percentage: 31, color: '#8b5cf6', amount: '₹1,499', count: 5 },
        { name: 'Productivity', percentage: 19, color: '#3b82f6', amount: '₹1,150', count: 3 },
        { name: 'Software', percentage: 13, color: '#06b6d4', amount: '₹899', count: 2 },
        { name: 'Health & Fitness', percentage: 12, color: '#10b981', amount: '₹800', count: 2 },
        { name: 'Shopping', percentage: 8, color: '#f97316', amount: '₹499', count: 2 },
        { name: 'Other', percentage: 17, color: '#64748b', amount: '₹650', count: 2 },
      ];

  // Helper for Category Icon Styling
  const getCategoryIconBg = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('entertain') || cat.includes('video')) return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    if (cat.includes('music')) return 'bg-pink-500/20 text-pink-400 border border-pink-500/30';
    if (cat.includes('productiv') || cat.includes('office')) return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    if (cat.includes('cloud') || cat.includes('storage')) return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    if (cat.includes('health') || cat.includes('fitness')) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (cat.includes('insur')) return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
    if (cat.includes('shop')) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
  };

  // Prominent Recent Subscriptions Table data
  const tableRows = subscriptions.length > 0
    ? subscriptions.slice(0, 10).map(sub => {
        const isCancelled = sub.status === 'cancelled';
        let status = 'Active';
        let statusColor = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';

        if (isCancelled) {
          status = 'Cancelled';
          statusColor = 'bg-rose-500/15 text-rose-400 border border-rose-500/30 line-through opacity-80';
        } else if (sub.duplicateGroup || (sub.overlappingWith && sub.overlappingWith.length > 0)) {
          status = 'Needs Review';
          statusColor = 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
        } else if (sub.wasteScore >= 70) {
          status = 'High Waste';
          statusColor = 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
        } else if (sub.riskLevel === 'HIGH') {
          status = 'High Risk';
          statusColor = 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
        }

        return {
          id: sub.id,
          name: sub.name,
          iconBg: getCategoryIconBg(sub.category),
          initial: sub.name.charAt(0),
          amount: `₹${sub.amount.toFixed(2)}`,
          numericAmount: sub.amount,
          cadence: sub.billingCycle.charAt(0).toUpperCase() + sub.billingCycle.slice(1),
          lastUsed: sub.daysSinceLastUsed === 0 ? 'Today' : `${sub.daysSinceLastUsed} days ago`,
          wasteScore: sub.wasteScore,
          confidence: sub.confidenceScore,
          risk: sub.riskLevel,
          status,
          statusColor,
          category: sub.category,
          reason: sub.analysisReasoning || `Subscription with ${sub.merchant}`,
          rawSub: sub,
        };
      })
    : [
        {
          id: 'sub_streamflix',
          name: 'StreamFlix',
          iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
          initial: 'S',
          amount: '₹499.00',
          numericAmount: 499.00,
          cadence: 'Monthly',
          lastUsed: '187 days ago',
          wasteScore: 92,
          confidence: 95,
          risk: 'LOW',
          status: 'Auto Cancel',
          statusColor: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
          category: 'Entertainment',
          reason: 'Unused for 187 days. High waste, low risk. Automatically cancelled per limit (₹1,500.00).',
        },
      ];

  // AI Command Quick Prompts
  const quickPrompts = [
    'Find subscriptions I haven\'t used in 90 days.',
    'Show duplicate subscriptions.',
    'How much can I save?',
    'Why wasn\'t this subscription cancelled?',
    'Pause all automation.',
  ];

  const handleRunAiCommand = async (command: string) => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.sendCommand(command);
      setAiResponse(res.message);
    } catch (err: any) {
      setAiResponse(`Unable to complete command: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* ROW 1: TOP 4 PRIMARY METRIC CARDS                        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Recurring Spend */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 shadow-sm hover:border-cyan-500/40 hover:shadow-[0_8px_30px_rgba(6,182,212,0.1)] transition-all duration-300 cursor-default"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-400">Total Recurring Spend</span>
          </div>

          <div className="mt-4 flex items-baseline space-x-1.5">
            <span className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              ₹{displaySpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-normal">/month</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-emerald-400 font-medium">
              <span>↓ 12% vs last month</span>
            </div>

            {/* Sparkline SVG */}
            <div className="w-24 h-6">
              <svg viewBox="0 0 100 24" className="w-full h-full stroke-cyan-400 fill-none stroke-[2.2]">
                <path d="M0,18 Q25,22 50,12 T100,6" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Potential Savings */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 shadow-sm hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] transition-all duration-300 cursor-default"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-400">Potential Savings</span>
          </div>

          <div className="mt-4 flex items-baseline space-x-1.5">
            <span className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              ₹{displayPotentialSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-normal">/month</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-emerald-400 font-medium">
              <span>↑ 8% vs last month</span>
            </div>

            {/* Sparkline SVG */}
            <div className="w-24 h-6">
              <svg viewBox="0 0 100 24" className="w-full h-full stroke-emerald-400 fill-none stroke-[2.2]">
                <path d="M0,20 Q30,8 65,14 T100,4" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Confirmed Savings */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 shadow-sm hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] transition-all duration-300 cursor-default"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-400">Confirmed Savings</span>
          </div>

          <div className="mt-4 flex items-baseline space-x-1.5">
            <span className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              ₹{displayConfirmedSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-normal">/month</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-emerald-400 font-medium">
              <span>↑ 100% vs last month</span>
            </div>

            {/* Sparkline SVG */}
            <div className="w-24 h-6">
              <svg viewBox="0 0 100 24" className="w-full h-full stroke-indigo-400 fill-none stroke-[2.2]">
                <path d="M0,22 Q35,20 60,10 T100,2" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Subscriptions Detected */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 shadow-sm hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300 cursor-default"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-400">Subscriptions Detected</span>
          </div>

          <div className="mt-4 flex items-baseline space-x-1.5">
            <span className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {displayDetected}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-emerald-400 font-medium">
              <span>+ 2 new</span>
            </div>

            {/* Sparkline SVG */}
            <div className="w-24 h-6">
              <svg viewBox="0 0 100 24" className="w-full h-full stroke-blue-400 fill-none stroke-[2.2]">
                <path d="M0,16 Q30,12 60,18 T100,8" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ======================================================== */}
      {/* ROW 2: 5 SECONDARY METRIC CARDS                          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* Unused Subscriptions */}
        <div className="rounded-xl bg-[#111A2E] border border-[#1b2a47] p-4 shadow-sm hover:border-[#223559] transition-all">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-slate-400 truncate">Unused Subscriptions</span>
          </div>
          <div className="mt-2 text-xl font-bold text-white tracking-tight">{unusedCount}</div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium">↓ 40% vs last month</div>
        </div>

        {/* Duplicates / Overlaps */}
        <div className="rounded-xl bg-[#111A2E] border border-[#1b2a47] p-4 shadow-sm hover:border-[#223559] transition-all">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
              <Copy className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-slate-400 truncate">Duplicates / Overlaps</span>
          </div>
          <div className="mt-2 text-xl font-bold text-white tracking-tight">{duplicateCount}</div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium">↓ 33% vs last month</div>
        </div>

        {/* Price Increases */}
        <div className="rounded-xl bg-[#111A2E] border border-[#1b2a47] p-4 shadow-sm hover:border-[#223559] transition-all">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-slate-400 truncate">Price Increases</span>
          </div>
          <div className="mt-2 text-xl font-bold text-white tracking-tight">{priceIncreaseCount}</div>
          <div className="mt-1 text-[11px] text-purple-400 font-medium">↑ 100% vs last month</div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-xl bg-[#111A2E] border border-[#1b2a47] p-4 shadow-sm hover:border-[#223559] transition-all">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-slate-400 truncate">Pending Approvals</span>
          </div>
          <div className="mt-2 text-xl font-bold text-white tracking-tight">{pendingApprovalsCount}</div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium">↓ 25% vs last month</div>
        </div>

        {/* Completed Actions */}
        <div className="rounded-xl bg-[#111A2E] border border-[#1b2a47] p-4 shadow-sm hover:border-[#223559] transition-all">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-slate-400 truncate">Completed Actions</span>
          </div>
          <div className="mt-2 text-xl font-bold text-white tracking-tight">{completedActionsCount}</div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium">↑ 300% vs last month</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 3: CHARTS SECTION (SPENDING OVERVIEW & CATEGORIES)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Spending Overview */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 lg:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm lg:text-base font-semibold text-white">Spending Overview</h2>

            {/* Time Filter Selector */}
            <div className="relative">
              <select
                id="chart-period-selector"
                value={chartPeriod}
                onChange={e => setChartPeriod(e.target.value as any)}
                aria-label="Select spending overview time period"
                className="appearance-none bg-[#0B111E] border border-[#1b2a47] text-xs font-medium text-slate-300 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="3M">Last 3 Months</option>
                <option value="6M">Last 6 Months</option>
                <option value="1Y">This Year</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Interactive SVG Chart Canvas */}
          <div className="relative h-64 w-full select-none">
            {/* Horizontal Grid lines with Rupee Labels */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-500 font-mono">
              <div className="flex items-center w-full">
                <span className="w-10">₹8,000</span>
                <div className="flex-1 border-b border-slate-800/60 ml-2" />
              </div>
              <div className="flex items-center w-full">
                <span className="w-10">₹6,000</span>
                <div className="flex-1 border-b border-slate-800/60 ml-2" />
              </div>
              <div className="flex items-center w-full">
                <span className="w-10">₹4,000</span>
                <div className="flex-1 border-b border-slate-800/60 ml-2" />
              </div>
              <div className="flex items-center w-full">
                <span className="w-10">₹2,000</span>
                <div className="flex-1 border-b border-slate-800/60 ml-2" />
              </div>
              <div className="flex items-center w-full">
                <span className="w-10">₹0</span>
                <div className="flex-1 border-b border-slate-800/60 ml-2" />
              </div>
            </div>

            {/* SVG Curves */}
            <svg
              viewBox="0 0 600 200"
              preserveAspectRatio="none"
              className="absolute left-12 right-2 top-2 bottom-6 w-[calc(100%-3.5rem)] h-[calc(100%-2rem)] overflow-visible"
            >
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Total Spend Path (Blue) */}
              <path
                d="M 20,93 C 120,60 160,80 240,75 C 320,70 380,45 460,70 C 520,80 560,85 580,88"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
              />

              {/* After Savings Path (Emerald) */}
              <path
                d="M 20,108 C 120,95 160,100 240,98 C 320,90 380,85 460,102 C 520,110 560,118 580,122"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />

              {/* Data points */}
              {chartData.map((d, i) => {
                const x = 20 + (i * (560 / (chartData.length - 1)));
                const ySpend = 200 - (d.spend / 600) * 190;
                const ySavings = 200 - (d.afterSavings / 600) * 190;
                const isHovered = hoveredMonthIndex === i;

                return (
                  <g key={d.month}>
                    {/* Hover vertical crosshair */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={200}
                        stroke="#475569"
                        strokeDasharray="3 3"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Spend circle */}
                    <circle
                      cx={x}
                      cy={ySpend}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#3b82f6"
                      stroke="#0B111E"
                      strokeWidth="2"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredMonthIndex(i)}
                      onMouseLeave={() => setHoveredMonthIndex(null)}
                    />

                    {/* After Savings circle */}
                    <circle
                      cx={x}
                      cy={ySavings}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#10b981"
                      stroke="#0B111E"
                      strokeWidth="2"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredMonthIndex(i)}
                      onMouseLeave={() => setHoveredMonthIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Month Labels */}
            <div className="absolute left-12 right-2 bottom-0 flex justify-between text-[11px] text-slate-400 font-medium">
              {chartData.map((d, i) => (
                <span
                  key={d.month}
                  className={`cursor-pointer transition-colors ${
                    hoveredMonthIndex === i ? 'text-white font-bold' : ''
                  }`}
                  onMouseEnter={() => setHoveredMonthIndex(i)}
                  onMouseLeave={() => setHoveredMonthIndex(null)}
                >
                  {d.month}
                </span>
              ))}
            </div>

            {/* Tooltip on Hover */}
            {hoveredMonthIndex !== null && chartData[hoveredMonthIndex] && (
              <div
                className="absolute z-20 pointer-events-none bg-[#0B111E]/95 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs"
                style={{
                  left: `${(hoveredMonthIndex / (chartData.length - 1)) * 75 + 10}%`,
                  top: '15%',
                }}
              >
                <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1.5">
                  {chartData[hoveredMonthIndex].month} Telemetry
                </div>
                <div className="flex items-center justify-between space-x-3 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Total Spend:
                  </span>
                  <span className="font-mono font-bold">₹{chartData[hoveredMonthIndex].spend.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between space-x-3 text-emerald-400 mt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    After Savings:
                  </span>
                  <span className="font-mono font-bold">₹{chartData[hoveredMonthIndex].afterSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800/80">
                  Net Saved: ₹{(chartData[hoveredMonthIndex].spend - chartData[hoveredMonthIndex].afterSavings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/mo
                </div>
              </div>
            )}
          </div>

          {/* Chart Legend */}
          <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Total Spend</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>After Savings</span>
            </div>
          </div>
        </div>

        {/* Right Chart: Subscription Categories (Donut) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 lg:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm lg:text-base font-semibold text-white">Subscription Categories</h2>
          </div>

          <div className="my-auto flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Entertainment: 31% */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#8b5cf6"
                  strokeWidth="15"
                  strokeDasharray="70 157"
                  strokeDashoffset="0"
                  className="transition-all hover:opacity-80 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('Entertainment')}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
                {/* Productivity: 19% */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="15"
                  strokeDasharray="43 184"
                  strokeDashoffset="-70"
                  className="transition-all hover:opacity-80 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('Productivity')}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
                {/* Software: 13% */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="15"
                  strokeDasharray="29 198"
                  strokeDashoffset="-113"
                  className="transition-all hover:opacity-80 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('Software')}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
                {/* Health & Fitness: 12% */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="15"
                  strokeDasharray="27 200"
                  strokeDashoffset="-142"
                  className="transition-all hover:opacity-80 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('Health & Fitness')}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
                {/* Shopping: 8% */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#f97316"
                  strokeWidth="15"
                  strokeDasharray="18 209"
                  strokeDashoffset="-169"
                  className="transition-all hover:opacity-80 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('Shopping')}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
                {/* Other: 17% */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#64748b"
                  strokeWidth="15"
                  strokeDasharray="38 189"
                  strokeDashoffset="-187"
                  className="transition-all hover:opacity-80 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('Other')}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              </svg>

              {/* Center Donut Hole Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white leading-none">16</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1.5 w-full sm:w-auto text-xs">
              {categories.map(cat => {
                const isHovered = hoveredCategory === cat.name;
                return (
                  <div
                    key={cat.name}
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`flex items-center justify-between sm:space-x-4 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                      isHovered ? 'bg-slate-800/80 text-white' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[11px] truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {isHovered && <span className="text-[10px] text-slate-400">{cat.amount}</span>}
                      <span className="text-[11px] font-semibold text-slate-300">{cat.percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROW 4: RECENT SUBSCRIPTIONS TABLE & RIGHT-SIDE WIDGETS   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Recent Subscriptions Table */}
        <div className="xl:col-span-8 rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 lg:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm lg:text-base font-semibold text-white">Recent Subscriptions</h2>
            <button
              id="view-all-subscriptions-btn"
              onClick={() => onNavigate('subscriptions')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] text-slate-400 font-medium select-none">
                  <th className="pb-3 pr-4">Merchant</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Cadence</th>
                  <th className="pb-3 pr-4">Last Used</th>
                  <th className="pb-3 pr-4 text-center">Waste Score</th>
                  <th className="pb-3 pr-4 text-center">Confidence</th>
                  <th className="pb-3 pr-4 text-center">Risk</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {tableRows.map((row, idx) => (
                  <tr
                    key={`${row.id}-${idx}`}
                    onClick={() => setSelectedSub(row)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Merchant name + badge */}
                    <td className="py-3.5 pr-4 flex items-center space-x-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${row.iconBg}`}
                      >
                        {row.initial}
                      </div>
                      <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {row.name}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 pr-4 font-mono font-medium text-white">{row.amount}</td>

                    {/* Cadence */}
                    <td className="py-3.5 pr-4 text-slate-400">{row.cadence}</td>

                    {/* Last Used */}
                    <td className="py-3.5 pr-4 text-slate-400">{row.lastUsed}</td>

                    {/* Waste Score */}
                    <td className="py-3.5 pr-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.wasteScore >= 70
                            ? 'bg-rose-500/15 text-rose-400'
                            : row.wasteScore >= 30
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {row.wasteScore}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 pr-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.confidence >= 90
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-cyan-500/15 text-cyan-400'
                        }`}
                      >
                        {row.confidence}
                      </span>
                    </td>

                    {/* Risk Level */}
                    <td className="py-3.5 pr-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          row.risk === 'LOW'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                            : row.risk === 'MEDIUM'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                        }`}
                      >
                        {row.risk}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${row.statusColor}`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Click on any row to open verified merchant proof, risk evidence, or manual override.
            </span>
            <span className="font-mono text-[11px] text-slate-500">Showing 5 of {displayDetected} items</span>
          </div>
        </div>

        {/* Right Column: AI Command, Recent Activity, Guardian Settings */}
        <div className="xl:col-span-4 space-y-5">
          {/* Card 1: AI Command Center (Beta) */}
          {!aiDismissed && (
            <div className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 shadow-sm relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-white">AI Command Center</h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Beta
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setAiDismissed(true)}
                  className="text-slate-500 hover:text-slate-300 p-1"
                  aria-label="Dismiss AI Command card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                Ask anything about your subscriptions, savings or settings.
              </p>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setAiQuery(prompt);
                      handleRunAiCommand(prompt);
                    }}
                    className="px-2.5 py-1 rounded-full bg-[#0B111E] border border-[#1b2a47] text-[11px] text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-[#15233e] transition-all text-left truncate max-w-full"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Response Display */}
              {aiLoading && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Synthesizing Guardian intelligence...</span>
                </div>
              )}

              {aiResponse && !aiLoading && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-slate-200 leading-relaxed animate-in fade-in">
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800 text-[10px] text-cyan-400 font-semibold">
                    <span>GUARDIAN INTELLIGENCE</span>
                    <button onClick={() => setAiResponse(null)} className="text-slate-500 hover:text-slate-300">
                      Clear
                    </button>
                  </div>
                  <p>{aiResponse}</p>
                </div>
              )}

              {/* Input field */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (aiQuery.trim()) {
                    handleRunAiCommand(aiQuery.trim());
                  }
                }}
                className="mt-3 relative"
              >
                <input
                  type="text"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  placeholder="Type your command..."
                  className="w-full bg-[#0B111E] border border-[#1b2a47] rounded-xl pl-3.5 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!aiQuery.trim() || aiLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 transition-colors"
                  aria-label="Send command"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Card 2: Recent Activity */}
          <div className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {/* Item 1: StreamFlix cancelled */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/30 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-white">StreamFlix cancelled automatically</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Unused for 187 days • ₹499/month</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Completed
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">2h ago</p>
                </div>
              </div>

              {/* Item 2: TuneWave & MusicBox flagged */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/30 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-white">TuneWave & MusicBox flagged</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Potential duplicate • Needs approval</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Pending
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">3h ago</p>
                </div>
              </div>

              {/* Item 3: HealthGuard blocked */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/30 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-white">HealthGuard Insurance blocked</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Protected category (insurance)</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Blocked
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">5h ago</p>
                </div>
              </div>

              {/* Item 4: Price increase */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/30 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-white">Price increase detected</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Adobe Creative Cloud • +₹150/month</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    Review
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">7h ago</p>
                </div>
              </div>

              {/* Item 5: Savings updated */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/30 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-white">Savings updated</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">₹2,148 this month</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                    Updated
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">8h ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Guardian Settings */}
          <div className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 shadow-sm">
            <button
              onClick={() => onNavigate('guardrails')}
              className="w-full flex items-center justify-between mb-3 text-left group"
            >
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                Guardian Settings
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Max automatic action amount:</span>
                <span className="font-mono font-semibold text-white">
                  ₹{(guardrails?.maxAutoAmount ?? 1500).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Protected categories:</span>
                <span className="font-medium text-white truncate max-w-[160px]">
                  Insurance, Loan Payments
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Protected merchants:</span>
                <span className="font-medium text-white">None</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Min confidence threshold:</span>
                <span className="font-mono font-semibold text-white">
                  {guardrails?.minConfidence ?? 70}%
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Allowed automatic actions:</span>
                <span className="font-medium text-white">Cancel, Downgrade</span>
              </div>

              {/* Pause all automation toggle */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Pause all automation</span>
                <button
                  id="guardian-settings-pause-toggle"
                  onClick={() => onUpdateGuardrails({ pauseAutomation: !isAutomationPaused })}
                  type="button"
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isAutomationPaused ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={isAutomationPaused}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isAutomationPaused ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE DETAIL MODAL FOR ANY CLICKED SUBSCRIPTION    */}
      {/* ======================================================== */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${selectedSub.iconBg}`}
                >
                  {selectedSub.initial}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedSub.name}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedSub.category} • {selectedSub.cadence}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0B111E] border border-slate-800/80">
                <span className="text-slate-400">Recurring Price:</span>
                <p className="text-base font-bold text-white mt-0.5">{selectedSub.amount}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0B111E] border border-slate-800/80">
                <span className="text-slate-400">Last Used:</span>
                <p className="text-base font-bold text-white mt-0.5">{selectedSub.lastUsed}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0B111E] border border-slate-800/80">
                <span className="text-slate-400">Waste Score:</span>
                <p className="text-base font-bold text-rose-400 mt-0.5">{selectedSub.wasteScore}/100</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0B111E] border border-slate-800/80">
                <span className="text-slate-400">Confidence Score:</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{selectedSub.confidence}%</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B111E] border border-slate-800/80 text-xs">
              <span className="font-semibold text-slate-300 block mb-1">Guardian Analysis & Invariant Evaluation:</span>
              <p className="text-slate-400 leading-relaxed">{selectedSub.reason}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400">Status: {selectedSub.status}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onExecuteAction(selectedSub.id, 'CANCEL');
                    setSelectedSub(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-colors"
                >
                  Execute Cancel
                </button>
                <button
                  onClick={() => {
                    onExecuteAction(selectedSub.id, 'DOWNGRADE');
                    setSelectedSub(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                >
                  Downgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
