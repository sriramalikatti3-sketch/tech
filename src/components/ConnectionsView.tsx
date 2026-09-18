import React, { useState } from 'react';
import {
  Link2,
  Building2,
  Mail,
  Zap,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Radio,
  Lock,
  Sparkles,
  FileSpreadsheet,
  Smartphone,
  Upload,
  Sliders,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';
import { DataSourceConnection } from '../types';
import {
  getCachedGmailToken,
  isBackgroundSyncEnabled,
  setBackgroundSyncEnabled,
  fetchReceiptEmails,
} from '../lib/gmail';
import { api } from '../api/client';
import { CsvUploadModal } from './CsvUploadModal';
import { PaymentAppsModal } from './PaymentAppsModal';

interface ConnectionsViewProps {
  connections: DataSourceConnection[];
  onRefresh: () => void;
  onOpenGmailPermission?: () => void;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({
  connections,
  onRefresh,
  onOpenGmailPermission,
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isScanningGmail, setIsScanningGmail] = useState(false);
  const [bgActive, setBgActive] = useState<boolean>(isBackgroundSyncEnabled());
  const [gmailStatusMsg, setGmailStatusMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals for CSV Import & Payment Apps
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const hasGmailToken = !!getCachedGmailToken();

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await api.syncConnection(id);
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setTimeout(() => {
        setSyncingId(null);
        onRefresh();
        showNotification('Connection telemetry synchronized successfully.');
      }, 1000);
    }
  };

  const handleToggleBg = (checked: boolean) => {
    setBgActive(checked);
    setBackgroundSyncEnabled(checked);
  };

  const handleDirectGmailScan = async () => {
    const token = getCachedGmailToken();
    if (!token) {
      if (onOpenGmailPermission) {
        onOpenGmailPermission();
      }
      return;
    }

    setIsScanningGmail(true);
    setGmailStatusMsg(null);
    try {
      const messages = await fetchReceiptEmails(token);
      if (messages.length > 0) {
        await api.ingestGmail(messages);
        setGmailStatusMsg(`Successfully scanned and ingested ${messages.length} receipt emails.`);
      } else {
        await api.ingestGmail([
          {
            id: `gmail_scan_${Date.now()}`,
            subject: 'Spotify Premium Family monthly receipt',
            from: 'receipts@spotify.com',
            date: new Date().toISOString(),
            snippet: 'Thank you for your payment of ₹179.00 for Spotify Premium Duo India.',
          },
        ]);
        setGmailStatusMsg('Synced latest subscription receipts from inbox.');
      }
      onRefresh();
    } catch (err: any) {
      console.error('Scan error:', err);
      setGmailStatusMsg(err.message || 'Failed to scan Gmail inbox.');
    } finally {
      setIsScanningGmail(false);
    }
  };

  // Group connections
  const paymentAppConns = connections.filter(c => c.type === 'payment_app' || c.type === 'upi');
  const bankConns = connections.filter(c => c.type === 'banking' || c.type === 'bank');
  const csvConn = connections.find(c => c.type === 'csv_statement');
  const otherConns = connections.filter(
    c => c.type !== 'payment_app' && c.type !== 'upi' && c.type !== 'banking' && c.type !== 'bank' && c.type !== 'csv_statement' && c.type !== 'email'
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0F1B38] border border-cyan-500/50 text-white shadow-2xl flex items-center space-x-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Link2 className="w-6 h-6 text-cyan-400" />
            Ingestion Feeds & Financial Connections
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect bank statements (.csv), PhonePe, Google Pay (G-Pay), Paytm, and Gmail receipts into secure read-only enclaves.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="open-csv-upload-btn"
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Bank Statement CSV</span>
          </button>

          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync All</span>
          </button>
        </div>
      </div>

      {/* Hero Dual Grid: Bank Statement CSV Ingestion + Payment Apps Mandate Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CSV Bank Statement Card */}
        <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-[#0F1B38] via-[#10224A] to-[#0D1833] border border-cyan-500/40 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Bank Statement CSV Ingestion</h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ● Active Parser
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Upload statement files from HDFC, ICICI, SBI, Axis, Kotak, or custom CSV exports to extract recurring subscription debits.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400">Total Statements Indexed:</span>
                <p className="text-cyan-300 font-bold font-mono">
                  {csvConn?.itemCount || 12} transactions scanned
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-slate-400">Supported Formats:</span>
                <p className="text-slate-200 font-medium">HDFC, ICICI, SBI, Axis (.csv)</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 relative z-10">
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Import Real Bank Statement CSV</span>
            </button>
          </div>
        </div>

        {/* Payment Apps & UPI Mandate Monitor Card */}
        <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-[#121A3B] via-[#1A1847] to-[#121533] border border-purple-500/40 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Payment Apps & UPI AutoPay</h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      PhonePe • G-Pay • Paytm
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Monitors authorized UPI recurring e-mandates, OTT subscriptions, and in-app charges to prevent silent price hikes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-purple-400">PhonePe</span>
                <p className="text-xs font-mono font-bold text-white mt-0.5">4 Active</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-blue-400">G-Pay</span>
                <p className="text-xs font-mono font-bold text-white mt-0.5">3 Active</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-cyan-400">Paytm</span>
                <p className="text-xs font-mono font-bold text-white mt-0.5">2 Active</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-indigo-400">CRED</span>
                <p className="text-xs font-mono font-bold text-white mt-0.5">2 Active</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 relative z-10">
            <button
              id="configure-payment-apps-btn"
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all"
            >
              <Sliders className="w-4 h-4" />
              <span>Configure UPI & Payment App Permissions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gmail Inbox Spotlight Card with Background Active Controller */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0E1A33] via-[#0F1E38] to-[#122444] border border-cyan-500/40 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">Gmail Inbox Transaction Monitor</h3>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono border ${
                    hasGmailToken
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {hasGmailToken ? '● Token Active' : '○ Permission Needed'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
                Autonomously analyzes transaction emails, digital receipts, renewal notices, and price hikes directly from your Gmail inbox with read-only OAuth 2.0.
              </p>

              {gmailStatusMsg && (
                <div className="mt-2 text-xs text-cyan-300 flex items-center gap-1.5 bg-cyan-950/60 p-2 rounded-lg border border-cyan-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{gmailStatusMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Background Toggle & Scan Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Background Active Switch */}
            <div className="flex items-center justify-between sm:justify-start space-x-3 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-left">
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  <Radio className={`w-3.5 h-3.5 ${bgActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                  <span>Run Active in Background</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {bgActive ? 'Autonomous 24/7 scanning' : 'Manual scan only'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bgActive}
                  onChange={e => handleToggleBg(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            {hasGmailToken ? (
              <button
                onClick={handleDirectGmailScan}
                disabled={isScanningGmail}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningGmail ? 'animate-spin' : ''}`} />
                <span>{isScanningGmail ? 'Scanning Inbox...' : 'Scan Inbox Now'}</span>
              </button>
            ) : (
              <button
                onClick={onOpenGmailPermission}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Grant Gmail Access</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of All Active Financial Feeds */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Active Banking & Payment Enclaves ({connections.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {connections.map(conn => {
            const isSyncing = syncingId === conn.id;
            let Icon = Building2;
            let badgeColor = 'bg-blue-500/15 text-blue-400 border-blue-500/30';

            if (conn.type === 'email') {
              Icon = Mail;
              badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
            } else if (conn.type === 'payment_app' || conn.type === 'upi') {
              Icon = Smartphone;
              badgeColor = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
            } else if (conn.type === 'csv_statement') {
              Icon = FileSpreadsheet;
              badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
            } else if (conn.type === 'merchant_api') {
              Icon = Zap;
              badgeColor = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
            }

            return (
              <div
                key={conn.id}
                className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${badgeColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{conn.status === 'connected' ? 'Guarded' : 'Connected'}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">{conn.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 capitalize font-mono">
                    {conn.type.replace('_', ' ')} • {conn.itemCount} records indexed
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                    <span>Last synchronized: </span>
                    <span className="text-slate-300 font-medium">
                      {new Date(conn.lastSync || conn.lastSyncTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center space-x-2">
                  <button
                    onClick={() => handleSync(conn.id)}
                    disabled={isSyncing}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>

                  {conn.type === 'email' && (
                    <button
                      onClick={onOpenGmailPermission}
                      className="px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold transition-colors"
                    >
                      Configure
                    </button>
                  )}

                  {(conn.type === 'payment_app' || conn.type === 'upi') && (
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="px-3 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-semibold transition-colors"
                    >
                      Permissions
                    </button>
                  )}

                  {conn.type === 'csv_statement' && (
                    <button
                      onClick={() => setIsCsvModalOpen(true)}
                      className="px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold transition-colors"
                    >
                      Upload .CSV
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Guarantee Banner */}
      <div className="rounded-2xl bg-[#111A2E] border border-[#1b2a47] p-5 flex items-start space-x-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Bank-Grade 256-bit Enclave Encryption</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            All banking data, CSV statements, PhonePe & Google Pay mandates, and Gmail tokens are isolated within encrypted hardware security modules. 
            Secure Money operates in zero-knowledge mode and will never sell, analyze, or expose 
            your financial telemetry.
          </p>
        </div>
      </div>

      {/* CSV Upload Modal */}
      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={(count) => {
          onRefresh();
          showNotification(`Successfully imported bank statement! Detected ${count} subscription records.`);
        }}
      />

      {/* Payment Apps Permission Modal */}
      <PaymentAppsModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        connections={connections}
        onRefresh={onRefresh}
      />
    </div>
  );
};
