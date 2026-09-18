import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Save,
  Check,
  Lock,
  IndianRupee,
  AlertOctagon,
  Percent,
} from 'lucide-react';
import { GuardrailConfig, ActionType } from '../types';

interface GuardrailsViewProps {
  guardrails: GuardrailConfig | null;
  onUpdateGuardrails: (updated: Partial<GuardrailConfig>) => Promise<void>;
}

export const GuardrailsView: React.FC<GuardrailsViewProps> = ({
  guardrails,
  onUpdateGuardrails,
}) => {
  const [maxAmount, setMaxAmount] = useState<number>(1500);
  const [minConfidence, setMinConfidence] = useState<number>(80);
  const [protectedCats, setProtectedCats] = useState<string[]>([]);
  const [pauseAuto, setPauseAuto] = useState<boolean>(false);
  const [allowedActions, setAllowedActions] = useState<ActionType[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (guardrails) {
      setMaxAmount(guardrails.maxAutoAmount);
      setMinConfidence(guardrails.minConfidence);
      setProtectedCats(guardrails.protectedCategories);
      setPauseAuto(guardrails.pauseAutomation);
      setAllowedActions(guardrails.allowedAutoActions);
    }
  }, [guardrails]);

  const availableCategories = [
    'insurance',
    'loan payments',
    'healthcare',
    'taxes',
    'rent',
    'education',
    'utilities',
  ];

  const toggleCategory = (cat: string) => {
    if (protectedCats.includes(cat)) {
      setProtectedCats(protectedCats.filter(c => c !== cat));
    } else {
      setProtectedCats([...protectedCats, cat]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateGuardrails({
        maxAutoAmount: Number(maxAmount),
        minConfidence: Number(minConfidence),
        protectedCategories: protectedCats,
        pauseAutomation: pauseAuto,
        allowedAutoActions: allowedActions,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          Deterministic Policy &amp; Guardrail Engine
        </h2>
        <p className="text-xs text-slate-400">
          The mathematical safety layer that holds final authority over every AI recommendation before execution.
        </p>
      </div>

      {/* Emergency Global Pause Switch */}
      <div
        className={`p-5 rounded-xl border transition-all ${
          pauseAuto
            ? 'bg-amber-950/40 border-amber-800/80 shadow-lg shadow-amber-900/10'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                pauseAuto ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                Emergency Switch: Pause All Autonomous Actions
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                When active, no subscriptions will be automatically cancelled or modified. All decisions will require explicit confirmation in the Review Center.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={pauseAuto}
              onChange={e => setPauseAuto(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {/* Max Auto Amount Limit */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-start space-x-3">
          <IndianRupee className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              Maximum Automatic Action Limit
            </h3>
            <p className="text-xs text-slate-400">
              Any subscription with a monthly charge exceeding this threshold will strictly require manual user authorization, regardless of dormant telemetry or AI confidence.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 pt-2">
          <input
            type="range"
            min="200"
            max="10000"
            step="100"
            value={maxAmount}
            onChange={e => setMaxAmount(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex items-center space-x-1 font-mono text-base font-bold text-emerald-400 shrink-0 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>₹</span>
            <span>{maxAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Subscriptions under ₹{maxAmount.toLocaleString('en-IN')} can qualify for autonomous optimization. Subscriptions exceeding this limit strictly route to the Review Center for explicit approval.
        </p>
      </div>

      {/* Protected Invariant Categories */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-start space-x-3">
          <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              Strict Protected Categories (Invariant Policy)
            </h3>
            <p className="text-xs text-slate-400">
              Subscriptions belonging to these categories are mathematically prevented from automatic cancellation or modification to protect against coverage or life-essential lapses.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {availableCategories.map(cat => {
            const isSelected = protectedCats.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-rose-950/70 border-rose-800 text-rose-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && <Lock className="w-3 h-3 text-rose-400" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500">
          HealthGuard Insurance is tagged under &ldquo;insurance&rdquo; and will always trigger rule RULE_PROTECTED_CATEGORY.
        </p>
      </div>

      {/* Minimum AI Confidence Threshold */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-start space-x-3">
          <Percent className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              Minimum AI Confidence Score Required
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous execution will be withheld if Gemini&rsquo;s assessment confidence falls below this value.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 pt-2">
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={minConfidence}
            onChange={e => setMinConfidence(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <div className="font-mono text-base font-bold text-teal-300 shrink-0 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {minConfidence}%
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          id="guardrails-save-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/10"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Policy Guardrails Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Policy...' : 'Save Guardrail Policy'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
