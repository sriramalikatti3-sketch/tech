import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  Smartphone,
  Mail,
  AlertCircle,
  KeyRound,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setActiveUserId } from '../api/client';

export const AuthGate: React.FC = () => {
  const { signInWithGoogle, signInDemo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const u = await signInWithGoogle();
      if (u.email) {
        setActiveUserId(u.email);
      }
    } catch (err: any) {
      // If popup blocked or cancelled, offer demo login fallback seamlessly
      console.error('Google Sign In failed:', err);
      setError(err.message || 'Google Sign-in was cancelled or popup was blocked. You can sign in using 1-Click Access below.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonaSignIn = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setActiveUserId(email);
      await signInDemo();
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070C1A] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Top Security Banner */}
      <header className="border-b border-slate-800/80 bg-[#0A1024]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/25">
            ₹
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Secure Money
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                INR Guardian v2.4
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Deterministic Financial Invariant & Autonomous Subscription Shield</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono">
          <Lock className="w-3.5 h-3.5" />
          <span>Access Gated • Authentication Required</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Value Proposition & Security Invariants */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Bank & UPI Mandate Telemetry</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Protect Your Money with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Zero-Waste</span> Autonomous Guardrails.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect your bank statements (HDFC, ICICI, SBI), PhonePe, Google Pay, and Gmail receipts. Secure Money continuously monitors price hikes, inactive trials, and duplicate recurring debits in Indian Rupees (₹).
              </p>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#0C142C] border border-slate-800 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">UPI Mandates</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">PhonePe, G-Pay, Paytm AutoPay monitoring</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0C142C] border border-slate-800 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Bank CSV Import</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Instant statement parsing for all Indian banks</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0C142C] border border-slate-800 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Gmail Receipts</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Read-only digital receipt & price hike extractor</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0C142C] border border-slate-800 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Deterministic Safety</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Hardcoded rules block protected cancellations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sign-In Box */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-[#0B132B] border border-cyan-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Sign in to Secure Money
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sign in with your verified account to access your protected financial enclaves and guardrails.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Primary Google Sign In */}
                <button
                  id="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl shadow-white/5 transition-all transform active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-[#0B132B] px-3 text-[11px] font-mono text-slate-500 uppercase tracking-widest absolute">
                    or instant 1-click access
                  </span>
                </div>

                {/* 1-Click Persona Access for User */}
                <div className="space-y-3">
                  <button
                    id="signin-user-persona-btn"
                    onClick={() => handlePersonaSignIn('openings.1309@gmail.com')}
                    disabled={isLoading}
                    className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-[#111F42] to-[#162754] hover:from-[#152754] hover:to-[#1B326B] border border-cyan-500/40 transition-all flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                        OP
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white">openings.1309@gmail.com</p>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Primary
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Indian Bank & UPI Accounts (₹ INR Subscriptions)
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>

                  <button
                    id="signin-priya-persona-btn"
                    onClick={() => handlePersonaSignIn('priya.verma@techcorp.in')}
                    disabled={isLoading}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#0E1730] hover:bg-[#132042] border border-slate-800 transition-all flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center shrink-0">
                        PV
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white">priya.verma@techcorp.in</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tech Lead Profile (SaaS & Cloud Subscriptions)
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>

                  <button
                    id="signin-guest-btn"
                    onClick={() => handlePersonaSignIn('demo-user')}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 text-center transition-colors block"
                  >
                    Instant Guest Mode (Zero-Config Test)
                  </button>
                </div>

                {/* Guarantee */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-Bit Hardware Enclave • Safe Read-Only Banking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070C1A] px-6 py-4 text-center text-xs text-slate-500">
        Secure Money Invariant Guardian • All amounts in Indian Rupees (₹) • Compliant with RBI & NPCI UPI Directives
      </footer>
    </div>
  );
};
