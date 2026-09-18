import { guardrailEngine } from '../policies/guardrailEngine.js';
import { Subscription, GuardrailConfig, TestScenarioResult } from '../models/types.js';

export async function runAllTests(): Promise<{
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: TestScenarioResult[];
}> {
  const results: TestScenarioResult[] = [];

  const defaultGuardrails: GuardrailConfig = {
    userId: 'test_user',
    maxAutoAmount: 1500.00,
    protectedCategories: ['insurance', 'loan payments', 'healthcare', 'taxes', 'rent'],
    protectedMerchants: ['HealthGuard Insurance', 'Vanguard', 'Care Health Insurance'],
    minConfidence: 80,
    maxAutoRisk: 'LOW',
    allowedAutoActions: ['AUTO_CANCEL', 'AUTO_DOWNGRADE', 'CREATE_CANCELLATION_DRAFT'],
    pauseAutomation: false,
    updatedAt: new Date().toISOString(),
  };

  // ==========================================
  // CASE 1: StreamFlix — ₹499.00/month — unused for 187 days — auto limit ₹1,500
  // Expected: AUTO_CANCEL
  // ==========================================
  {
    const t0 = Date.now();
    const streamflixSub: Subscription = {
      id: 'test_streamflix',
      userId: 'test_user',
      name: 'StreamFlix',
      merchant: 'StreamFlix Media',
      category: 'Entertainment',
      amount: 499.00,
      currency: 'INR',
      billingCycle: 'monthly',
      status: 'active',
      firstSeenDate: '2025-01-01',
      lastChargeDate: '2026-03-01',
      nextChargeDate: '2026-04-01',
      daysSinceLastUsed: 187,
      usageLevel: 'unused',
      priceHistory: [{ date: '2025-01-01', amount: 499.00 }],
      isTrialConversion: false,
      isPriceIncrease: false,
      wasteScore: 96,
      confidenceScore: 98,
      riskLevel: 'LOW',
      analysisReasoning: 'Unused for 187 days. Clear dormant subscription.',
      evidence: ['187 days without streaming playback', 'Below auto-limit of ₹1,500.00'],
      createdAt: '2025-01-01',
      updatedAt: '2026-03-01',
    };

    const decision = guardrailEngine.evaluate({
      subscription: streamflixSub,
      aiRecommendation: 'AUTO_CANCEL',
      confidenceScore: 98,
      wasteScore: 96,
      riskLevel: 'LOW',
      guardrails: defaultGuardrails,
      reasoning: streamflixSub.analysisReasoning,
      evidence: streamflixSub.evidence,
    });

    const passed = decision.finalAction === 'AUTO_CANCEL' && decision.guardrailEvaluation.passed === true;

    results.push({
      testId: 'CASE_1',
      name: 'CASE 1: StreamFlix (₹499.00/mo, unused 187 days, limit ₹1,500)',
      expectedResult: 'AUTO_CANCEL',
      actualResult: decision.finalAction,
      passed,
      durationMs: Date.now() - t0,
      decision,
      details: passed
        ? 'PASSED: StreamFlix was correctly authorized for AUTO_CANCEL. Within limit (₹499 <= ₹1,500), non-protected, high confidence.'
        : `FAILED: Expected AUTO_CANCEL, got ${decision.finalAction}. Reason: ${decision.guardrailEvaluation.reason}`,
    });
  }

  // ==========================================
  // CASE 2: TuneWave (₹299, used 4 days ago) & MusicBox Premium (₹399, used 40 days ago)
  // Both music streaming.
  // Expected: REQUEST_APPROVAL
  // Invariant: Do not automatically decide which service the user wants.
  // ==========================================
  {
    const t0 = Date.now();
    const musicboxSub: Subscription = {
      id: 'test_musicbox',
      userId: 'test_user',
      name: 'MusicBox Premium',
      merchant: 'MusicBox Digital',
      category: 'Music',
      amount: 399.00,
      currency: 'INR',
      billingCycle: 'monthly',
      status: 'active',
      firstSeenDate: '2025-01-01',
      lastChargeDate: '2026-03-01',
      nextChargeDate: '2026-04-01',
      daysSinceLastUsed: 40,
      usageLevel: 'low',
      priceHistory: [{ date: '2025-01-01', amount: 399.00 }],
      isTrialConversion: false,
      isPriceIncrease: false,
      duplicateGroup: 'music_streaming',
      overlappingWith: ['test_tunewave'],
      wasteScore: 68,
      confidenceScore: 90,
      riskLevel: 'MEDIUM',
      analysisReasoning: 'MusicBox Premium overlaps with TuneWave (₹299.00). Requires user preference choice.',
      evidence: ['Duplicate music streaming services active', 'User catalog preference unknown'],
      createdAt: '2025-01-01',
      updatedAt: '2026-03-01',
    };

    // Even if AI might suggest AUTO_CANCEL or DOWNGRADE, the deterministic guardrail MUST enforce REQUEST_APPROVAL
    const decision = guardrailEngine.evaluate({
      subscription: musicboxSub,
      aiRecommendation: 'AUTO_CANCEL', // Intentionally probe with AUTO_CANCEL
      confidenceScore: 90,
      wasteScore: 68,
      riskLevel: 'MEDIUM',
      guardrails: defaultGuardrails,
      reasoning: musicboxSub.analysisReasoning,
      evidence: musicboxSub.evidence,
    });

    const passed =
      decision.finalAction === 'REQUEST_APPROVAL' &&
      decision.guardrailEvaluation.rulesTriggered.includes('RULE_DUPLICATE_AMBIGUITY');

    results.push({
      testId: 'CASE_2',
      name: 'CASE 2: Overlapping Music Streaming (TuneWave & MusicBox)',
      expectedResult: 'REQUEST_APPROVAL',
      actualResult: decision.finalAction,
      passed,
      durationMs: Date.now() - t0,
      decision,
      details: passed
        ? 'PASSED: Duplicate ambiguity guard fired (RULE_DUPLICATE_AMBIGUITY). Overrode AUTO_CANCEL and correctly demanded REQUEST_APPROVAL.'
        : `FAILED: Expected REQUEST_APPROVAL, got ${decision.finalAction}. Reason: ${decision.guardrailEvaluation.reason}`,
    });
  }

  // ==========================================
  // CASE 3: HealthGuard Insurance — ₹2,499/month — category insurance
  // Insurance is protected.
  // Expected: BLOCKED_BY_GUARDRAIL
  // ==========================================
  {
    const t0 = Date.now();
    const insuranceSub: Subscription = {
      id: 'test_healthguard',
      userId: 'test_user',
      name: 'HealthGuard Insurance',
      merchant: 'HealthGuard Mutual',
      category: 'insurance',
      amount: 2499.00,
      currency: 'INR',
      billingCycle: 'monthly',
      status: 'active',
      firstSeenDate: '2024-01-01',
      lastChargeDate: '2026-03-01',
      nextChargeDate: '2026-04-01',
      daysSinceLastUsed: 300,
      usageLevel: 'unused',
      priceHistory: [{ date: '2024-01-01', amount: 2499.00 }],
      isTrialConversion: false,
      isPriceIncrease: false,
      wasteScore: 10,
      confidenceScore: 99,
      riskLevel: 'HIGH',
      analysisReasoning: 'Health insurance policy.',
      evidence: ['Protected category: insurance', 'Medical coverage'],
      createdAt: '2024-01-01',
      updatedAt: '2026-03-01',
    };

    const decision = guardrailEngine.evaluate({
      subscription: insuranceSub,
      aiRecommendation: 'AUTO_CANCEL', // Intentionally test adversarial AI recommendation
      confidenceScore: 99,
      wasteScore: 80,
      riskLevel: 'HIGH',
      guardrails: defaultGuardrails,
      reasoning: 'AI falsely suggested cancellation due to lack of app logins',
      evidence: ['No logins in 300 days'],
    });

    const passed =
      decision.finalAction === 'BLOCKED_BY_GUARDRAIL' &&
      decision.guardrailEvaluation.rulesTriggered.includes('RULE_PROTECTED_CATEGORY');

    results.push({
      testId: 'CASE_3',
      name: 'CASE 3: HealthGuard Insurance (₹2,499/mo, category insurance)',
      expectedResult: 'BLOCKED_BY_GUARDRAIL',
      actualResult: decision.finalAction,
      passed,
      durationMs: Date.now() - t0,
      decision,
      details: passed
        ? 'PASSED: Deterministic category invariant (RULE_PROTECTED_CATEGORY) blocked execution. Insurance cannot be auto-modified.'
        : `FAILED: Expected BLOCKED_BY_GUARDRAIL, got ${decision.finalAction}. Reason: ${decision.guardrailEvaluation.reason}`,
    });
  }

  // ==========================================
  // INVARIANT 4: Amount Exceeds Limit (₹2,450.00 > ₹1,500.00)
  // Expected: REQUEST_APPROVAL
  // ==========================================
  {
    const t0 = Date.now();
    const gymSub: Subscription = {
      id: 'test_gym',
      userId: 'test_user',
      name: 'Cultpass Elite Gym Membership',
      merchant: 'Curefit Healthcare',
      category: 'Fitness',
      amount: 2450.00,
      currency: 'INR',
      billingCycle: 'monthly',
      status: 'active',
      firstSeenDate: '2025-01-01',
      lastChargeDate: '2026-03-01',
      nextChargeDate: '2026-04-01',
      daysSinceLastUsed: 120,
      usageLevel: 'unused',
      priceHistory: [{ date: '2025-01-01', amount: 2450.00 }],
      isTrialConversion: false,
      isPriceIncrease: false,
      wasteScore: 95,
      confidenceScore: 92,
      riskLevel: 'LOW',
      analysisReasoning: 'Unused gym membership',
      evidence: ['Unused 120 days'],
      createdAt: '2025-01-01',
      updatedAt: '2026-03-01',
    };

    const decision = guardrailEngine.evaluate({
      subscription: gymSub,
      aiRecommendation: 'AUTO_CANCEL',
      confidenceScore: 92,
      wasteScore: 95,
      riskLevel: 'LOW',
      guardrails: defaultGuardrails, // auto limit is ₹1,500.00
      reasoning: 'Unused for 120 days',
      evidence: ['120 days of zero gym scans'],
    });

    const passed =
      decision.finalAction === 'REQUEST_APPROVAL' &&
      decision.guardrailEvaluation.rulesTriggered.includes('RULE_AMOUNT_EXCEEDS_LIMIT');

    results.push({
      testId: 'INVARIANT_AMOUNT_LIMIT',
      name: 'INVARIANT: Amount Limit Check (₹2,450.00 > ₹1,500.00 auto limit)',
      expectedResult: 'REQUEST_APPROVAL',
      actualResult: decision.finalAction,
      passed,
      durationMs: Date.now() - t0,
      decision,
      details: passed
        ? 'PASSED: Amount (₹2,450.00) exceeds auto limit (₹1,500.00). Escalated to user authorization.'
        : `FAILED: Expected REQUEST_APPROVAL, got ${decision.finalAction}.`,
    });
  }

  // ==========================================
  // INVARIANT 5: Global Automation Paused
  // Expected: REQUEST_APPROVAL
  // ==========================================
  {
    const t0 = Date.now();
    const pausedGuardrails = { ...defaultGuardrails, pauseAutomation: true };
    const cheapSub: Subscription = {
      id: 'test_cheap',
      userId: 'test_user',
      name: 'Cheap Cloud Backup',
      merchant: 'CloudBackup',
      category: 'Cloud',
      amount: 4.99,
      currency: 'USD',
      billingCycle: 'monthly',
      status: 'active',
      firstSeenDate: '2025-01-01',
      lastChargeDate: '2026-03-01',
      nextChargeDate: '2026-04-01',
      daysSinceLastUsed: 200,
      usageLevel: 'unused',
      priceHistory: [{ date: '2025-01-01', amount: 4.99 }],
      isTrialConversion: false,
      isPriceIncrease: false,
      wasteScore: 99,
      confidenceScore: 99,
      riskLevel: 'LOW',
      analysisReasoning: 'Unused cloud backup',
      evidence: ['200 days inactive'],
      createdAt: '2025-01-01',
      updatedAt: '2026-03-01',
    };

    const decision = guardrailEngine.evaluate({
      subscription: cheapSub,
      aiRecommendation: 'AUTO_CANCEL',
      confidenceScore: 99,
      wasteScore: 99,
      riskLevel: 'LOW',
      guardrails: pausedGuardrails,
      reasoning: 'Dormant service',
      evidence: ['200 days inactive'],
    });

    const passed =
      decision.finalAction === 'REQUEST_APPROVAL' &&
      decision.guardrailEvaluation.rulesTriggered.includes('RULE_PAUSE_AUTOMATION_ACTIVE');

    results.push({
      testId: 'INVARIANT_GLOBAL_PAUSE',
      name: 'INVARIANT: Global Automation Pause Switch',
      expectedResult: 'REQUEST_APPROVAL',
      actualResult: decision.finalAction,
      passed,
      durationMs: Date.now() - t0,
      decision,
      details: passed
        ? 'PASSED: Global pause held action for manual review.'
        : `FAILED: Expected REQUEST_APPROVAL, got ${decision.finalAction}.`,
    });
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    passed: failedCount === 0,
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}

// Standalone CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=====================================================');
  console.log('  SUBSCRIPTION GUARDIAN - BACKEND TEST SUITE RUNNER  ');
  console.log('=====================================================\n');

  runAllTests().then(suite => {
    suite.results.forEach(r => {
      const badge = r.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${badge} [${r.testId}] ${r.name} (${r.durationMs}ms)`);
      console.log(`  Expected: ${r.expectedResult} | Actual: ${r.actualResult}`);
      console.log(`  Details:  ${r.details}\n`);
    });

    console.log('-----------------------------------------------------');
    console.log(`Results: ${suite.passedCount}/${suite.total} Passed (${suite.passed ? 'ALL SUCCEEDED' : 'FAILURES DETECTED'})`);
    console.log('=====================================================\n');

    if (!suite.passed) {
      process.exit(1);
    }
  });
}
