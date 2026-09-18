import { GoogleGenAI, Type } from '@google/genai';
import { Subscription, ActionType, RiskLevel } from '../models/types.js';

export interface AISubscriptionAnalysis {
  recommendation: ActionType;
  wasteScore: number;
  confidenceScore: number;
  riskLevel: RiskLevel;
  reasoning: string;
  evidence: string[];
}

export interface AICommandResult {
  message: string;
  suggestedAction?: {
    type: string;
    payload?: any;
  };
  matchedSubscriptions?: string[];
}

let geminiClient: GoogleGenAI | null = null;
let quotaCooldownUntil = 0;
let lastQuotaNoticeTime = 0;

// In-memory cache to prevent repetitive API calls for unchanged subscriptions
interface CacheEntry {
  analysis: AISubscriptionAnalysis;
  timestamp: number;
}
const analysisCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

function handleGeminiError(err: any): void {
  const errStr = String(err?.message || err?.status || err || '');
  const is429 =
    errStr.includes('429') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('Quota exceeded') ||
    err?.status === 429 ||
    err?.code === 429;

  if (is429) {
    // Parse retry delay from error if available (e.g. "retry in 52s")
    const retryMatch = errStr.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i) ||
                       errStr.match(/"retryDelay":\s*"([0-9]+)s"/i);
    const retrySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
    quotaCooldownUntil = Date.now() + Math.max(30, retrySec) * 1000;

    const now = Date.now();
    if (now - lastQuotaNoticeTime > 30000) {
      console.info(`[Secure Money AI] Gemini quota reached. Cooldown active (${Math.round((quotaCooldownUntil - now) / 1000)}s). Seamlessly engaging deterministic heuristic engine.`);
      lastQuotaNoticeTime = now;
    }
  } else {
    console.warn('[Secure Money AI] Gemini note:', err?.message || errStr);
  }
}

export class GeminiAgent {
  /**
   * Evaluates subscription usage, billing signals, and duplicate status
   * using Gemini with structured JSON output and in-memory caching.
   */
  async analyzeSubscription(
    sub: Subscription,
    context: {
      allSubscriptions: Subscription[];
      recentEmails?: any[];
      usageMetrics?: any;
    }
  ): Promise<AISubscriptionAnalysis> {
    const cacheKey = `${sub.id}:${sub.amount}:${sub.daysSinceLastUsed}:${sub.usageLevel}:${sub.isPriceIncrease}:${sub.isTrialConversion}`;
    const cached = analysisCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.analysis;
    }

    const ai = getGeminiClient();

    // Check if quota is currently cooling down
    const isCoolingDown = Date.now() < quotaCooldownUntil;

    if (ai && !isCoolingDown) {
      try {
        const subSummary = {
          name: sub.name,
          merchant: sub.merchant,
          category: sub.category,
          amount: sub.amount,
          billingCycle: sub.billingCycle,
          daysSinceLastUsed: sub.daysSinceLastUsed,
          usageLevel: sub.usageLevel,
          isTrialConversion: sub.isTrialConversion,
          isPriceIncrease: sub.isPriceIncrease,
          priceHistory: sub.priceHistory,
          duplicateGroup: sub.duplicateGroup,
          overlappingWith: sub.overlappingWith,
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Analyze this recurring subscription for Secure Money Guardian.
Subscription Data:
${JSON.stringify(subSummary, null, 2)}

Provide an accurate waste score (0-100), confidence score (0-100), risk level (LOW, MEDIUM, HIGH),
recommended action (AUTO_CANCEL, AUTO_DOWNGRADE, REQUEST_APPROVAL, or KEEP), concise reasoning, and exact factual evidence from the provided data.
Do not fabricate missing details.`,
          config: {
            systemInstruction: `You are the AI Subscription Analyst for Secure Money.
Your job is to analyze real subscription telemetry, detect recurring waste, identify free-trial conversions, price hikes, and duplicate overlap.
Analyze and recommend accurately. Deterministic guardrails will execute after your analysis.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendation: {
                  type: Type.STRING,
                  description: 'Recommended action: AUTO_CANCEL, AUTO_DOWNGRADE, REQUEST_APPROVAL, or KEEP',
                },
                wasteScore: {
                  type: Type.NUMBER,
                  description: 'Score from 0 (essential/actively used) to 100 (complete waste/dormant)',
                },
                confidenceScore: {
                  type: Type.NUMBER,
                  description: 'AI confidence in assessment from 0 to 100',
                },
                riskLevel: {
                  type: Type.STRING,
                  description: 'Risk assessment: LOW, MEDIUM, or HIGH',
                },
                reasoning: {
                  type: Type.STRING,
                  description: 'Concise explanation of the findings',
                },
                evidence: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Key facts from telemetry supporting the recommendation',
                },
              },
              required: ['recommendation', 'wasteScore', 'confidenceScore', 'riskLevel', 'reasoning', 'evidence'],
            },
          },
        });

        const raw = response.text?.trim();
        if (raw) {
          const parsed = JSON.parse(raw) as AISubscriptionAnalysis;
          const result: AISubscriptionAnalysis = {
            recommendation: this.normalizeAction(parsed.recommendation),
            wasteScore: Math.max(0, Math.min(100, Math.round(parsed.wasteScore))),
            confidenceScore: Math.max(0, Math.min(100, Math.round(parsed.confidenceScore))),
            riskLevel: this.normalizeRisk(parsed.riskLevel),
            reasoning: parsed.reasoning || 'Evaluated by Gemini AI agent.',
            evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [parsed.reasoning],
          };

          analysisCache.set(cacheKey, { analysis: result, timestamp: Date.now() });
          return result;
        }
      } catch (err: any) {
        handleGeminiError(err);
      }
    }

    // Deterministic fallback analyzer when offline, rate-limited, or cooling down
    const fallback = this.fallbackAnalysis(sub);
    analysisCache.set(cacheKey, { analysis: fallback, timestamp: Date.now() });
    return fallback;
  }

  /**
   * AI Command Center: Process natural language commands and questions
   */
  async processCommand(
    command: string,
    context: {
      subscriptions: Subscription[];
      guardrails: any;
      stats: any;
      recentActions: any[];
    }
  ): Promise<AICommandResult> {
    const ai = getGeminiClient();
    const cmdLower = command.trim().toLowerCase();

    // Fast-path deterministic commands for instant feedback & safety
    if (cmdLower.includes('pause all automation') || cmdLower.includes('pause automation')) {
      return {
        message: 'Global automation paused. All upcoming autonomous actions will be held for manual approval.',
        suggestedAction: { type: 'PAUSE_AUTOMATION', payload: { pause: true } },
      };
    }
    if (cmdLower.includes('resume automation') || cmdLower.includes('enable automation')) {
      return {
        message: 'Automation resumed. Deterministic guardrails remain active.',
        suggestedAction: { type: 'PAUSE_AUTOMATION', payload: { pause: false } },
      };
    }
    if (cmdLower.includes('90 days') || cmdLower.includes('haven\'t used in 90')) {
      const matched = context.subscriptions.filter(s => s.daysSinceLastUsed >= 90 && s.status === 'active');
      return {
        message: `Found ${matched.length} subscription(s) unused for 90+ days:\n${matched.map(s => `• ${s.name} (₹${s.amount}/mo, unused for ${s.daysSinceLastUsed} days)`).join('\n')}`,
        matchedSubscriptions: matched.map(s => s.id),
      };
    }
    if (cmdLower.includes('duplicate')) {
      const matched = context.subscriptions.filter(s => s.duplicateGroup || (s.overlappingWith && s.overlappingWith.length > 0));
      return {
        message: `Found duplicate overlapping services in your accounts:\n${matched.map(s => `• ${s.name} (₹${s.amount}/mo, category: ${s.category})`).join('\n')}\nSecure Money requires manual confirmation before canceling duplicates to protect your preferred provider.`,
        matchedSubscriptions: matched.map(s => s.id),
      };
    }
    if (cmdLower.includes('how much can i save') || cmdLower.includes('potential savings') || cmdLower.includes('save?')) {
      return {
        message: `Based on current scans, your monthly potential savings are ₹${context.stats.potentialSavingsMonthly.toFixed(2)} (₹${context.stats.potentialSavingsAnnual.toFixed(2)}/year). You have already confirmed ₹${context.stats.confirmedSavingsMonthly.toFixed(2)}/mo in verified cancellations.`,
      };
    }
    if (cmdLower.includes('why wasn\'t') || cmdLower.includes('why was not')) {
      const matched = context.subscriptions.find(s => cmdLower.includes(s.name.toLowerCase()));
      if (matched) {
        if (matched.category.toLowerCase() === 'insurance') {
          return {
            message: `${matched.name} was not cancelled because it belongs to the protected "insurance" category. Policy rule PROTECTED_CATEGORY_INVARIANT strictly blocks automatic actions to avoid coverage lapses.`,
            matchedSubscriptions: [matched.id],
          };
        }
        if (matched.amount > context.guardrails.maxAutoAmount) {
          return {
            message: `${matched.name} was not automatically cancelled because its charge of ₹${matched.amount} exceeds your configured maximum automatic limit of ₹${context.guardrails.maxAutoAmount}. It was routed to the Review Center for your explicit approval.`,
            matchedSubscriptions: [matched.id],
          };
        }
        if (matched.duplicateGroup) {
          return {
            message: `${matched.name} was not automatically cancelled because it overlaps with another service in "${matched.category}". Secure Money never automatically decides between duplicate services when user preference is unknown.`,
            matchedSubscriptions: [matched.id],
          };
        }
        return {
          message: `${matched.name} status is ${matched.status}. Waste score is ${matched.wasteScore}/100. Guardrail reason: ${matched.analysisReasoning}`,
          matchedSubscriptions: [matched.id],
        };
      }
    }

    const isCoolingDown = Date.now() < quotaCooldownUntil;

    if (ai && !isCoolingDown) {
      try {
        const subContext = context.subscriptions.map(s => ({
          name: s.name,
          amount: s.amount,
          category: s.category,
          status: s.status,
          daysSinceLastUsed: s.daysSinceLastUsed,
          wasteScore: s.wasteScore,
          isPriceIncrease: s.isPriceIncrease,
          isTrialConversion: s.isTrialConversion,
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `User Query: "${command}"
Active Subscriptions (all currency in INR / Rupees ₹):
${JSON.stringify(subContext, null, 2)}
Guardrail Settings: Max auto limit: ₹${context.guardrails.maxAutoAmount}, Protected categories: ${context.guardrails.protectedCategories.join(', ')}.

Answer the user clearly and factually. Ground every response directly in the provided subscription records and guardrail rules. Mention currency as ₹.`,
        });

        const text = response.text?.trim();
        if (text) {
          return { message: text };
        }
      } catch (err: any) {
        handleGeminiError(err);
      }
    }

    return {
      message: `I analyzed your active subscriptions and guardrail configurations. Your current monthly recurring spend is ₹${context.stats.recurringSpendMonthly.toFixed(2)}. ${context.stats.unusedSubscriptions} dormant subscription(s) detected. Guardrail protection active.`,
    };
  }

  private normalizeAction(action: string): ActionType {
    const act = (action || '').toUpperCase().trim();
    if (act.includes('CANCEL')) return 'AUTO_CANCEL';
    if (act.includes('DOWNGRADE')) return 'AUTO_DOWNGRADE';
    if (act.includes('APPROVAL') || act.includes('REVIEW')) return 'REQUEST_APPROVAL';
    return 'KEEP';
  }

  private normalizeRisk(risk: string): RiskLevel {
    const r = (risk || '').toUpperCase().trim();
    if (r === 'HIGH') return 'HIGH';
    if (r === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  }

  private fallbackAnalysis(sub: Subscription): AISubscriptionAnalysis {
    if (sub.category.toLowerCase() === 'insurance') {
      return {
        recommendation: 'KEEP',
        wasteScore: 0,
        confidenceScore: 99,
        riskLevel: 'HIGH',
        reasoning: 'Insurance policies are critical protections and cannot be treated as waste.',
        evidence: ['Protected category: insurance', 'Essential coverage'],
      };
    }

    if (sub.daysSinceLastUsed >= 180) {
      return {
        recommendation: 'AUTO_CANCEL',
        wasteScore: 96,
        confidenceScore: 98,
        riskLevel: 'LOW',
        reasoning: `Unused for ${sub.daysSinceLastUsed} days. High waste, low risk.`,
        evidence: [
          `No device or platform activity for ${sub.daysSinceLastUsed} days`,
          `Regular monthly recurring charges of ₹${sub.amount.toFixed(2)}`,
        ],
      };
    }

    if (sub.duplicateGroup || (sub.overlappingWith && sub.overlappingWith.length > 0)) {
      return {
        recommendation: 'REQUEST_APPROVAL',
        wasteScore: 65,
        confidenceScore: 90,
        riskLevel: 'MEDIUM',
        reasoning: `Overlapping service in ${sub.category}. Requires user preference before action.`,
        evidence: [
          `Multiple subscriptions active in category ${sub.category}`,
          'Autonomous choice prohibited without user preference',
        ],
      };
    }

    if (sub.isPriceIncrease) {
      return {
        recommendation: 'AUTO_DOWNGRADE',
        wasteScore: 50,
        confidenceScore: 88,
        riskLevel: 'LOW',
        reasoning: 'Price increased recently. Recommend negotiating or downgrading tier.',
        evidence: ['Price increase detected in billing history'],
      };
    }

    if (sub.daysSinceLastUsed >= 60) {
      return {
        recommendation: 'REQUEST_APPROVAL',
        wasteScore: 80,
        confidenceScore: 85,
        riskLevel: 'LOW',
        reasoning: `Unused for ${sub.daysSinceLastUsed} days. Review recommended.`,
        evidence: [`${sub.daysSinceLastUsed} days of inactivity`],
      };
    }

    return {
      recommendation: 'KEEP',
      wasteScore: 10,
      confidenceScore: 95,
      riskLevel: 'LOW',
      reasoning: 'Subscription is actively utilized and in good standing.',
      evidence: [`Used ${sub.daysSinceLastUsed} days ago`],
    };
  }
}

export const geminiAgent = new GeminiAgent();
