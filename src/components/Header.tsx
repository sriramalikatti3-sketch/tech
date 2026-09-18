import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Mail,
  Lock,
  LogOut,
  LogIn,
  Radio,
  Sparkles,
} from 'lucide-react';
import { GuardianStats, GuardrailConfig } from '../types';
import { useAuth } from '../context/AuthContext';
import { isBackgroundSyncEnabled } from '../lib/gmail';

interface HeaderProps {
  stats: GuardianStats | null;
  guardrails: GuardrailConfig | null;
  isScanning: boolean;
  onTriggerScan: () => void;
  onResetData: () => void;
  onNavigateToGuardrails?: () => void;
  onOpenGmailPermission?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  guardrails: _guardrails,
  isScanning,
  onTriggerScan,
  onResetData,
  onNavigateToGuardrails,
  onOpenGmailPermission,
  onOpenAuth,
}) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const bgActive = isBackgroundSyncEnabled();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const [greeting, setGreeting] = useState<string>(getGreeting);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Formatted scan time
  const formattedScanTime = stats?.lastScanTime
    ? new Date(stats.lastScanTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' • ' +
      new Date(stats.lastScanTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Apr 28, 2025 • 9:14 AM';

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Alex';
  const displayEmail = user?.email || 'alex.smith@fintech.io';
  const initials = (displayName || 'SM').slice(0, 2).toUpperCase();

  return (
    <header className="bg-[#0B111E]/95 backdrop-blur-md border-b border-[#172239] px-6 lg:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-20 transition-all duration-300">
      {/* Left: Greeting & Subtitle */}
      <div>
        <AnimatePresence mode="wait">
          <motion.h1
            key={greeting}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl lg:text-2xl font-bold text-white tracking-tight flex items-center gap-2"
          >
            <span>{greeting}, {displayName}!</span>
            <motion.span
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 6, duration: 1.8, ease: "easeInOut" }}
              className="inline-block origin-[70%_70%] text-xl cursor-default select-none"
            >
              👋
            </motion.span>
          </motion.h1>
        </AnimatePresence>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-xs lg:text-sm text-slate-400 mt-0.5"
        >
          Secure Money is autonomously guarding your recurring expenses & receipts.
        </motion.p>
      </div>

      {/* Right: Actions, Status, Gmail Connector, User Profile */}
      <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
        {/* Gmail Transaction Ingestion Button */}
        {onOpenGmailPermission && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenGmailPermission}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-700/60 hover:border-cyan-500 text-cyan-300 text-xs font-semibold shadow-sm transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            title="Scan Gmail for subscription receipts and price-hikes"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Scan Gmail Inbox</span>
            <span className="sm:hidden">Gmail</span>
          </motion.button>
        )}

        {/* Background Active Pulse Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border transition-all ${
            bgActive
              ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
          title={bgActive ? 'Background monitoring is active' : 'Background monitoring paused'}
        >
          <Radio className={`w-3.5 h-3.5 ${bgActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span>{bgActive ? 'Background Active' : 'Background Idle'}</span>
        </motion.div>

        {/* Last Scan Stamp */}
        <div className="hidden xl:flex items-center text-xs text-slate-400 font-medium">
          <span>Last scan: {formattedScanTime}</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id="notifications-toggle-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-full bg-[#111A2E] border border-[#1b2a47] text-slate-300 hover:text-white hover:border-slate-700 transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0B111E] animate-pulse">
                1
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#111A2E]/95 backdrop-blur-xl border border-[#1E293B] shadow-2xl p-4 z-50 text-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-semibold text-white">Notifications & Alerts</span>
                  {hasUnread && (
                    <button
                      onClick={() => setHasUnread(false)}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>

                <div className="py-3 space-y-3">
                  <div className="flex items-start space-x-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">Gmail Ingestion Ready</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Authorize read-only access to scan transaction receipts and renewal price spikes automatically.
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">Just now</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">TuneWave & MusicBox flagged</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Potential duplicate music streaming subscriptions detected. 1 review pending.
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">3 hours ago</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">StreamFlix cancelled automatically</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        187 days without streaming. ₹499/mo saved.
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Pill / Auth Trigger */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            id="user-profile-menu-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#111A2E] border border-[#1b2a47] hover:border-slate-700 transition-colors"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-7 h-7 rounded-full border border-cyan-500/50 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-semibold text-[11px] flex items-center justify-center shadow-sm">
                {initials}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline max-w-[110px] truncate">
              {displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#111A2E]/95 backdrop-blur-xl border border-[#1E293B] shadow-2xl p-2 z-50 text-xs"
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white truncate">{displayName}</p>
                    {isAuthenticated ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Firebase
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Guest
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{displayEmail}</p>
                </div>

                <div className="py-1">
                  {onOpenAuth && (
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isAuthenticated ? 'Manage Firebase Account' : 'Sign in with Firebase'}</span>
                    </button>
                  )}

                  {onOpenGmailPermission && (
                    <button
                      onClick={() => {
                        onOpenGmailPermission();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Gmail Receipt Scanner</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onTriggerScan();
                      setShowUserMenu(false);
                    }}
                    disabled={isScanning}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isScanning ? 'Scanning...' : 'Trigger Instant Scan'}</span>
                  </button>

                  {onNavigateToGuardrails && (
                    <button
                      onClick={() => {
                        onNavigateToGuardrails();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Guardrail Rules</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onResetData();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Demo Data</span>
                  </button>

                  {isAuthenticated && (
                    <button
                      onClick={async () => {
                        await signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-800 px-3 py-1.5 text-[10px] text-slate-500 font-mono">
                  Secure Money Engine v3.0
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
