import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  Lock,
  RefreshCw,
  Bell,
  Eye,
  Sliders,
} from 'lucide-react';
import { api } from '../api/client';
import { DataSourceConnection } from '../types';

interface PaymentAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: DataSourceConnection[];
  onRefresh: () => void;
}

interface PaymentAppOption {
  id: string;
  name: string;
  tagline: string;
  iconBg: string;
  badge: string;
  initials: string;
  defaultPermissions: { id: string; label: string; desc: string; enabled: boolean }[];
  activeMandates: number;
}

const PAYMENT_APPS: PaymentAppOption[] = [
  {
    id: 'phonepe',
    name: 'PhonePe UPI AutoPay',
    tagline: 'e-Mandates, OTT & Bill Auto-Debit Engine',
    iconBg: 'bg-[#5f259f]/30 text-[#a855f7] border-[#5f259f]/50',
    badge: 'NPCI UPI AutoPay',
    initials: 'पे',
    activeMandates: 4,
    defaultPermissions: [
      {
        id: 'read_mandates',
        label: 'Read UPI AutoPay Recurring Mandates',
        desc: 'Monitors authorized active mandates like Hotstar, Netflix, Swiggy',
        enabled: true,
      },
      {
        id: 'read_sms_alerts',
        label: 'Auto-Debit SMS & Push Digest',
        desc: 'Detects upcoming debit notifications 24h prior to charge',
        enabled: true,
      },
      {
        id: 'detect_price_hike',
        label: 'Autonomous Rate Increase Detection',
        desc: 'Alerts if a merchant increases the recurring mandate cap',
        enabled: true,
      },
      {
        id: 'revoke_auth',
        label: 'One-Click Invariant UPI Revocation',
        desc: 'Allows Secure Money to prepare cancellation tokens for unused services',
        enabled: false,
      },
    ],
  },
  {
    id: 'gpay',
    name: 'Google Pay (G-Pay)',
    tagline: 'Google Play Subscriptions & UPI Mandates',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    badge: 'Google Play & UPI',
    initials: 'G',
    activeMandates: 3,
    defaultPermissions: [
      {
        id: 'read_mandates',
        label: 'Read UPI Recurring Mandates',
        desc: 'Syncs active standing instructions created in Google Pay',
        enabled: true,
      },
      {
        id: 'read_play_subscriptions',
        label: 'Google Play Billing Ingestion',
        desc: 'Detects in-app renewals, free trial expirations, and cloud storage',
        enabled: true,
      },
      {
        id: 'monitor_autopay',
        label: 'Mandate Modification Alerts',
        desc: 'Notifies when recurring schedule changes occur',
        enabled: true,
      },
    ],
  },
  {
    id: 'paytm',
    name: 'Paytm Payments & Wallet',
    tagline: 'Fastag, Utility & OTT Recurring Subscriptions',
    iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    badge: 'Paytm UPI SI',
    initials: 'P',
    activeMandates: 2,
    defaultPermissions: [
      {
        id: 'read_mandates',
        label: 'Read Wallet & UPI Auto-Debits',
        desc: 'Tracks auto-renewal authorizations and standing instructions',
        enabled: true,
      },
      {
        id: 'read_wallet_sub',
        label: 'Recurring Wallet Drain Prevention',
        desc: 'Flags background wallet withdrawals for inactive services',
        enabled: true,
      },
    ],
  },
  {
    id: 'cred',
    name: 'CRED UPI & Card AutoPay',
    tagline: 'Credit Card Auto-Debits & Club Subscriptions',
    iconBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    badge: 'CRED Protect',
    initials: 'C',
    activeMandates: 2,
    defaultPermissions: [
      {
        id: 'read_mandates',
        label: 'Track Credit Card Auto-Debits',
        desc: 'Monitors recurring statement charges and merchant standing orders',
        enabled: true,
      },
      {
        id: 'protect_autopay',
        label: 'Hidden Fee & Duplicate Invariant Scanner',
        desc: 'Flags recurring charges that double-dip across payment methods',
        enabled: true,
      },
    ],
  },
];

export const PaymentAppsModal: React.FC<PaymentAppsModalProps> = ({
  isOpen,
  onClose,
  connections,
  onRefresh,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>('phonepe');
  const [permissionsState, setPermissionsState] = useState<Record<string, Record<string, boolean>>>({
    phonepe: { read_mandates: true, read_sms_alerts: true, detect_price_hike: true, revoke_auth: false },
    gpay: { read_mandates: true, read_play_subscriptions: true, monitor_autopay: true },
    paytm: { read_mandates: true, read_wallet_sub: true },
    cred: { read_mandates: true, protect_autopay: true },
  });
  const [appEnabledState, setAppEnabledState] = useState<Record<string, boolean>>({
    phonepe: true,
    gpay: true,
    paytm: true,
    cred: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentApp = PAYMENT_APPS.find(a => a.id === selectedAppId) || PAYMENT_APPS[0];

  const handleTogglePerm = (appId: string, permId: string) => {
    setPermissionsState(prev => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        [permId]: !prev[appId]?.[permId],
      },
    }));
  };

  const handleToggleApp = (appId: string) => {
    setAppEnabledState(prev => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  const handleSaveAppPermissions = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      const perms = Object.entries(permissionsState[selectedAppId] || {})
        .filter(([_, enabled]) => enabled)
        .map(([id]) => id);

      await api.togglePaymentApp(selectedAppId, appEnabledState[selectedAppId] ?? true, perms);
      await api.triggerScan();
      setSaveSuccess(`Permissions updated & live sync initiated for ${currentApp.name}.`);
      onRefresh();
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update app permissions:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0B132B] border border-cyan-500/40 p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Payment Apps & UPI Mandate Permission Monitor
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                NPCI & RBI Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Grant permissions to monitor recurring AutoPay mandates from PhonePe, Google Pay, Paytm, and CRED to detect phantom charges.
            </p>
          </div>
        </div>

        {/* Main Grid: Left App Selector, Right Permissions Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-y-auto pr-1">
          {/* Left App List */}
          <div className="md:col-span-5 space-y-2.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Payment Gateway / App
            </label>

            {PAYMENT_APPS.map(app => {
              const isSelected = app.id === selectedAppId;
              const isEnabled = appEnabledState[app.id] ?? true;

              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#14234B] border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                      : 'bg-[#0E1730] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm shrink-0 ${app.iconBg}`}
                    >
                      {app.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{app.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{app.badge}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isEnabled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                </button>
              );
            })}

            {/* Invariant Guarantee */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1 mt-4">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero-Knowledge Telemetry</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                UPI PINs and OTPs are never accessible. Secure Money only inspects recurring mandate identifiers.
              </p>
            </div>
          </div>

          {/* Right Permissions Configuration */}
          <div className="md:col-span-7 rounded-2xl bg-[#0E1733] border border-slate-800 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              {/* App Title & Master Toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${currentApp.iconBg}`}
                  >
                    {currentApp.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{currentApp.name}</h4>
                    <p className="text-[11px] text-slate-400">{currentApp.tagline}</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appEnabledState[currentApp.id] ?? true}
                    onChange={() => handleToggleApp(currentApp.id)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <span className="text-slate-400">Active Monitored Mandates:</span>
                <span className="text-cyan-300 font-mono font-bold">{currentApp.activeMandates} e-Mandates</span>
              </div>

              {/* Permission Items List */}
              <div className="space-y-3 pt-1">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Permission Scopes & Telemetry Hooks
                </label>

                {currentApp.defaultPermissions.map(perm => {
                  const isChecked = permissionsState[currentApp.id]?.[perm.id] ?? perm.enabled;
                  const isAppEnabled = appEnabledState[currentApp.id] ?? true;

                  return (
                    <div
                      key={perm.id}
                      onClick={() => isAppEnabled && handleTogglePerm(currentApp.id, perm.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isChecked && isAppEnabled
                          ? 'bg-[#132145] border-cyan-500/40 text-white'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-semibold">{perm.label}</p>
                        <p className="text-[10px] text-slate-400 leading-normal">{perm.desc}</p>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked && isAppEnabled}
                        disabled={!isAppEnabled}
                        onChange={() => {}}
                        className="mt-1 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 shrink-0"
                      />
                    </div>
                  );
                })}
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleSaveAppPermissions}
                disabled={isSaving}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Updating & Syncing...' : `Save & Sync ${currentApp.name}`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Secure Money continuously polls active UPI e-mandates to safeguard against unapproved increases.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
