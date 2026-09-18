import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  CreditCard,
  Radar,
  Inbox,
  PiggyBank,
  FileCheck2,
  Bot,
  Sliders,
  Link2,
  Settings2,
  Shield,
  Sun,
  Moon,
  Monitor,
  CheckCircle,
  Mail,
  Lock,
  Radio,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { isBackgroundSyncEnabled } from '../lib/gmail';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingReviewCount: number;
  activeSubCount: number;
  automationPaused: boolean;
  onToggleAutomation: () => void;
  theme: 'dark' | 'light' | 'system';
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
  onOpenGmailPermission?: () => void;
  onOpenAuth?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount,
  activeSubCount: _activeSubCount,
  automationPaused,
  onToggleAutomation,
  theme,
  onThemeChange,
  onOpenGmailPermission,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const bgActive = isBackgroundSyncEnabled();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'scan', label: 'Guardian Scan', icon: Radar },
    {
      id: 'review',
      label: 'Review Center',
      icon: Inbox,
      badge: pendingReviewCount > 0 ? pendingReviewCount : 3,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'audit', label: 'Activity / Audit', icon: FileCheck2 },
    { id: 'command', label: 'AI Command Center', icon: Bot },
    { id: 'guardrails', label: 'Guardrails', icon: Sliders },
    { id: 'connections', label: 'Connections', icon: Link2 },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <aside className="w-64 bg-[#0B111E] border-r border-[#172239] flex flex-col justify-between shrink-0 select-none min-h-screen">
      {/* Top: Logo, Brand & Navigation */}
      <div>
        {/* Brand Header */}
        <div className="p-6 pb-5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <Shield className="w-5 h-5 text-cyan-200 fill-cyan-400/20" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                  Secure Money
                </h1>
              </div>
              <p className="text-[10px] text-cyan-400 font-mono tracking-tight">
                Autonomous Financial Guardian
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Find the money you're quietly leaking every month — and stop it, autonomously.
          </p>
        </div>

        {/* Gmail & Auth Quick Bar */}
        <div className="px-4 mb-3 space-y-1.5">
          {onOpenGmailPermission && (
            <button
              onClick={onOpenGmailPermission}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 hover:border-cyan-500/60 text-cyan-300 text-xs font-semibold transition-all group"
            >
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Scan Gmail Inbox</span>
              </div>
              <span className="text-[10px] font-mono bg-cyan-900/80 px-1.5 py-0.5 rounded text-cyan-200">
                Receipts
              </span>
            </button>
          )}

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#111A2E] hover:bg-slate-800 border border-[#1b2a47] text-slate-300 text-xs font-medium transition-all"
            >
              <div className="flex items-center space-x-2 truncate">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">
                  {isAuthenticated ? (user?.displayName || user?.email || 'Firebase Vault') : 'Firebase Sign In'}
                </span>
              </div>
              <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group overflow-hidden ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-600/25 -z-0"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <div className="relative z-10 flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full transition-transform ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Automation Toggle Card, Background Status, Theme Selector */}
      <div className="p-4 space-y-3">
        {/* Automation Status Card */}
        <div className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle
                className={`w-4 h-4 ${!automationPaused ? 'text-emerald-400' : 'text-slate-500'}`}
              />
              <span className="text-xs font-semibold text-white">Automation</span>
            </div>

            <button
              id="sidebar-automation-toggle"
              onClick={onToggleAutomation}
              type="button"
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                !automationPaused ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
              role="switch"
              aria-checked={!automationPaused}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  !automationPaused ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <Radio className={`w-3 h-3 ${bgActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              Background:
            </span>
            <span className={bgActive ? 'text-cyan-300 font-mono' : 'text-slate-500 font-mono'}>
              {bgActive ? 'ACTIVE 24/7' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center justify-between p-1 bg-[#111A2E] border border-[#1b2a47] rounded-xl text-slate-400 text-xs">
          <button
            id="theme-light-btn"
            onClick={() => onThemeChange('light')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg transition-colors ${
              theme === 'light'
                ? 'bg-slate-800 text-white font-medium shadow-sm'
                : 'hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="text-[11px]">Light</span>
          </button>
          <button
            id="theme-dark-btn"
            onClick={() => onThemeChange('dark')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="text-[11px]">Dark</span>
          </button>
          <button
            id="theme-system-btn"
            onClick={() => onThemeChange('system')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg transition-colors ${
              theme === 'system'
                ? 'bg-slate-800 text-white font-medium shadow-sm'
                : 'hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="text-[11px]">System</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
