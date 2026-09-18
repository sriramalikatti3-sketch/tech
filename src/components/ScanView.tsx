import React, { useState } from 'react';
import {
  Radar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
  Layers,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { ScanResponse } from '../api/client';
import { Subscription, GuardrailConfig } from '../types';

interface ScanViewProps {
  subscriptions: Subscription[];
  guardrails: GuardrailConfig | null;
  lastScanResult: ScanResponse | null;
  isScanning: boolean;
  onTriggerScan: () => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  subscriptions,
  guardrails,
  lastScanResult,
  isScanning,
  onTriggerScan,
}) => {
  const activeSubs = subscriptions.filter(s => s.status !== 'cancelled');

  return (
    <div className="space-y-6">
      {/* Scan Control Header */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Radar className={`w-5 h-5 text-emerald-400 ${isScanning ? 'animate-spin' : ''}`} />
            <h2 className="text-base font-bold text-white tracking-tight">
              Guardian Autonomous Scan Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Runs the end-to-end autonomous pipeline: fetches simulated OpenBanking &amp; email signals, detects recurring charges, performs Gemini AI scoring, validates against deterministic guardrails, executes authorized cancellations, and logs cryptographic verification codes.
          </p>
        </div>

        <button
          id="scan-view-trigger-btn"
          onClick={onTriggerScan}
          disabled={isScanning}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold text-slate-950 transition-all shadow-lg shrink-0 ${
            isScanning
              ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
              : 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20 active:scale-95'
          }`}
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running Autonomous Pipeline...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Trigger Scan Now</span>
            </>
          )}
        </button>
      </div>

      {/* Live Pipeline Telemetry Steps */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Autonomous Pipeline Execution Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lastScanResult?.telemetry ? (
            lastScanResult.telemetry.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{step.step}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{step.details}</p>
                <div className="text-[10px] font-mono text-slate-500 text-right">
                  {step.durationMs}ms
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
              Click &ldquo;Trigger Scan Now&rdquo; to execute live autonomous pipeline analysis.
            </div>
          )}
        </div>
      </div>

      {/* Real-time Subscriptions Evaluation Board */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Evaluated Subscription Decisions ({activeSubs.length} Active Records)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSubs.map((sub, idx) => {
            const isProtected = guardrails?.protectedCategories.some(c =>
              sub.category.toLowerCase().includes(c.toLowerCase())
            );
            const isDuplicate = Boolean(sub.duplicateGroup);
            const isAutoEligible =
              !isProtected &&
              !isDuplicate &&
              sub.amount <= (guardrails?.maxAutoAmount || 20) &&
              sub.daysSinceLastUsed > 90;

            return (
              <div
                key={`${sub.id}-${idx}`}
                className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{sub.name}</span>
                      <span className="text-xs font-mono text-emerald-400">
                        ${sub.amount.toFixed(2)}/mo
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Category: {sub.category} • Inactive for {sub.daysSinceLastUsed} days
                    </span>
                  </div>

                  {/* Decision Tag */}
                  {isProtected ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      BLOCKED
                    </span>
                  ) : isDuplicate ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      APPROVAL
                    </span>
                  ) : isAutoEligible ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      AUTO_CANCEL
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      KEEP
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-300 font-medium">Policy Engine: </span>
                  {isProtected
                    ? 'Protected category invariant active. Action prohibited.'
                    : isDuplicate
                    ? 'Duplicate overlap with peer provider. User preference unknown.'
                    : isAutoEligible
                    ? `Eligible for autonomous cancellation under $${guardrails?.maxAutoAmount} threshold.`
                    : 'Within nominal usage or exceeding auto threshold.'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
