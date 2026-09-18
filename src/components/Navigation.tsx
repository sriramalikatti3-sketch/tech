import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Radar,
  Inbox,
  Sliders,
  FileCheck2,
  Bot,
  TestTube2,
  Settings2,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingReviewCount: number;
  activeSubCount: number;
}

interface NavTab {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  alert?: boolean;
  highlight?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount,
  activeSubCount,
}) => {
  const tabs: NavTab[] = [
    { id: 'overview', label: 'Guardian Overview', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, count: activeSubCount },
    { id: 'scan', label: 'Guardian Scan', icon: Radar },
    { id: 'review', label: 'Review Center', icon: Inbox, count: pendingReviewCount, alert: pendingReviewCount > 0 },
    { id: 'guardrails', label: 'Policy & Guardrails', icon: Sliders },
    { id: 'audit', label: 'Execution & Audit', icon: FileCheck2 },
    { id: 'command', label: 'AI Command Center', icon: Bot },
    { id: 'tests', label: 'Test Suite', icon: TestTube2, highlight: true },
    { id: 'settings', label: 'Data & Feeds', icon: Settings2 },
  ];

  return (
    <nav className="bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id as ActiveTab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tab.alert
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}

                {tab.highlight && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
