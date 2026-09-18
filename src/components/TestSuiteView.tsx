import React, { useState, useEffect } from 'react';
import {
  TestTube2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { api, TestSuiteResponse } from '../api/client';
import { TestScenarioResult } from '../types';

export const TestSuiteView: React.FC = () => {
  const [suiteResult, setSuiteResult] = useState<TestSuiteResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>('CASE_1');

  const runTests = async () => {
    setIsRunning(true);
    try {
      const res = await api.runTests();
      setSuiteResult(res);
    } catch (err) {
      console.error('Error running test suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run on mount so the user immediately sees green checkmarks!
    runTests();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TestTube2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Automated Backend Test Suite
            </h2>
            {suiteResult && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  suiteResult.passed
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {suiteResult.passed ? 'All 5 Tests Passing' : 'Failures Detected'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Automated verification of prompt-required test cases (Case 1: StreamFlix, Case 2: TuneWave vs MusicBox, Case 3: HealthGuard Insurance) and policy invariants.
          </p>
        </div>

        <button
          id="run-automated-tests-btn"
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Tests...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Rerun Test Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {suiteResult?.results.map(test => {
          const isExpanded = expandedId === test.testId;

          return (
            <div
              key={test.testId}
              className={`bg-slate-900 rounded-xl border transition-all ${
                test.passed
                  ? 'border-emerald-900/60 shadow-sm'
                  : 'border-rose-900/80 shadow-rose-900/10'
              }`}
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : test.testId)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850/50 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      test.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {test.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{test.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Expected: <strong className="text-slate-200 font-mono">{test.expectedResult}</strong> • Actual: <strong className="text-emerald-400 font-mono">{test.actualResult}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    {test.durationMs}ms
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Collapsible Trace Drawer */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-800 space-y-3 bg-slate-950/40 rounded-b-xl">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
                    {test.details}
                  </div>

                  {test.decision && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          AI Proposal vs Guardrail
                        </span>
                        <div className="text-slate-200">
                          AI Recommendation: <strong className="text-amber-300">{test.decision.aiRecommendation}</strong>
                        </div>
                        <div className="text-slate-200">
                          Deterministic Final Action: <strong className="text-emerald-300">{test.decision.finalAction}</strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          Triggered Policy Invariants
                        </span>
                        <div className="font-mono text-[11px] text-emerald-400">
                          {test.decision.guardrailEvaluation.rulesTriggered.length > 0
                            ? test.decision.guardrailEvaluation.rulesTriggered.join(', ')
                            : 'All Checks Passed (Safe for auto-action)'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
