import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Subscription,
  GuardrailConfig,
  ActionRecord,
  AuditLog,
  ReviewQueueItem,
  Transaction,
  SimulatedEmail,
  ConnectionStatus,
  GuardianStats,
} from '../models/types.js';

interface StoreData {
  subscriptions: Subscription[];
  guardrails: Record<string, GuardrailConfig>;
  actions: ActionRecord[];
  auditLogs: AuditLog[];
  reviewQueue: ReviewQueueItem[];
  transactions: Transaction[];
  emails: SimulatedEmail[];
  connections: ConnectionStatus[];
  lastScanTime?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'guardian_store.json');

export const DEFAULT_USER_ID = 'user_guardian_default';

function dateStr(daysAgo: number): string {
  const now = new Date();
  const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

function createDefaultGuardrails(userId: string): GuardrailConfig {
  return {
    userId,
    maxAutoAmount: 1500.00, // ₹1,500 INR auto limit
    protectedCategories: ['insurance', 'loan payments', 'healthcare', 'taxes', 'rent'],
    protectedMerchants: ['HealthGuard Insurance', 'Care Health Insurance', 'Star Health', 'HDFC Life', 'LIC'],
    minConfidence: 80,
    maxAutoRisk: 'LOW',
    allowedAutoActions: ['AUTO_CANCEL', 'AUTO_DOWNGRADE', 'CREATE_CANCELLATION_DRAFT'],
    pauseAutomation: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates user-specific subscriptions, bank transactions, receipts, and review queue items.
 */
function generateUserData(userId: string): {
  subscriptions: Subscription[];
  guardrails: GuardrailConfig;
  actions: ActionRecord[];
  auditLogs: AuditLog[];
  reviewQueue: ReviewQueueItem[];
  transactions: Transaction[];
  emails: SimulatedEmail[];
} {
  const lowerUser = userId.toLowerCase();

  // SPECIAL PERSONA 1: openings.1309@gmail.com
  if (lowerUser.includes('openings') || lowerUser.includes('1309')) {
    const subs: Subscription[] = [
      {
        id: `sub_${userId}_chess`,
        userId,
        name: 'Chess.com Diamond',
        merchant: 'Chess.com LLC',
        category: 'Gaming & Strategy',
        amount: 829.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(420),
        lastChargeDate: dateStr(12),
        nextChargeDate: dateStr(-18),
        daysSinceLastUsed: 0,
        usageLevel: 'high',
        priceHistory: [
          { date: dateStr(420), amount: 829.00 },
          { date: dateStr(12), amount: 829.00 },
        ],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 4,
        confidenceScore: 98,
        riskLevel: 'LOW',
        analysisReasoning: 'Daily chess tactics and blitz games logged today. Actively utilized core subscription.',
        evidence: ['Logged in today with 14 active games played', 'Billed ₹829 via HDFC UPI AutoPay'],
        createdAt: dateStr(420),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_hotstar`,
        userId,
        name: 'Disney+ Hotstar Super',
        merchant: 'Novi Digital Entertainment',
        category: 'Entertainment',
        amount: 299.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(280),
        lastChargeDate: dateStr(18),
        nextChargeDate: dateStr(-12),
        daysSinceLastUsed: 42,
        usageLevel: 'low',
        priceHistory: [
          { date: dateStr(280), amount: 299.00 },
          { date: dateStr(18), amount: 299.00 },
        ],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 68,
        confidenceScore: 91,
        riskLevel: 'LOW',
        analysisReasoning: 'No playback logged in 42 days. Moderate waste indicator; review recommended.',
        evidence: ['42 days of inactivity across smart TV and Android devices', 'Recurring monthly ₹299 debit'],
        createdAt: dateStr(280),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_spotify`,
        userId,
        name: 'Spotify Premium Individual',
        merchant: 'Spotify India Pvt Ltd',
        category: 'Music',
        amount: 119.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(360),
        lastChargeDate: dateStr(5),
        nextChargeDate: dateStr(-25),
        daysSinceLastUsed: 1,
        usageLevel: 'high',
        priceHistory: [
          { date: dateStr(360), amount: 119.00 },
          { date: dateStr(5), amount: 119.00 },
        ],
        isTrialConversion: false,
        isPriceIncrease: false,
        duplicateGroup: 'music_streaming',
        overlappingWith: [`sub_${userId}_applemusic`],
        wasteScore: 12,
        confidenceScore: 94,
        riskLevel: 'MEDIUM',
        analysisReasoning: 'Daily music listening detected yesterday. Overlaps with Apple Music India (₹99/mo).',
        evidence: ['Active music stream yesterday (2.8 hours)', 'Duplicate provider active in Music category'],
        createdAt: dateStr(360),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_applemusic`,
        userId,
        name: 'Apple Music India',
        merchant: 'Apple India Pvt Ltd',
        category: 'Music',
        amount: 99.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(190),
        lastChargeDate: dateStr(22),
        nextChargeDate: dateStr(-8),
        daysSinceLastUsed: 54,
        usageLevel: 'low',
        priceHistory: [
          { date: dateStr(190), amount: 99.00 },
          { date: dateStr(22), amount: 99.00 },
        ],
        isTrialConversion: false,
        isPriceIncrease: false,
        duplicateGroup: 'music_streaming',
        overlappingWith: [`sub_${userId}_spotify`],
        wasteScore: 76,
        confidenceScore: 93,
        riskLevel: 'MEDIUM',
        analysisReasoning: 'Unused for 54 days while Spotify Premium (₹119/mo) is actively used. Overlapping duplicate.',
        evidence: ['54 days zero audio stream sessions', 'Overlaps with primary provider Spotify Premium (₹119)'],
        createdAt: dateStr(190),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_googleone`,
        userId,
        name: 'Google One 200GB Storage',
        merchant: 'Google Cloud India',
        category: 'Cloud Storage',
        amount: 210.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(600),
        lastChargeDate: dateStr(1),
        nextChargeDate: dateStr(-29),
        daysSinceLastUsed: 0,
        usageLevel: 'high',
        priceHistory: [{ date: dateStr(600), amount: 210.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 5,
        confidenceScore: 99,
        riskLevel: 'LOW',
        analysisReasoning: 'Critical storage active for openings.1309@gmail.com (138GB / 200GB utilized). Essential service.',
        evidence: ['Daily Gmail & Google Drive sync active', 'Storage usage 69% capacity'],
        createdAt: dateStr(600),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_prime`,
        userId,
        name: 'Amazon Prime India',
        merchant: 'Amazon Seller Services Pvt Ltd',
        category: 'Entertainment & Deliveries',
        amount: 149.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(450),
        lastChargeDate: dateStr(10),
        nextChargeDate: dateStr(-20),
        daysSinceLastUsed: 2,
        usageLevel: 'high',
        priceHistory: [{ date: dateStr(450), amount: 149.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 10,
        confidenceScore: 96,
        riskLevel: 'LOW',
        analysisReasoning: 'Frequent Prime delivery and video streaming usage.',
        evidence: ['Active delivery order 2 days ago', 'Prime Video watch session 3 days ago'],
        createdAt: dateStr(450),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_cultfit`,
        userId,
        name: 'Cultpass LIVE Online Fitness',
        merchant: 'Curefit Healthcare Pvt Ltd',
        category: 'Fitness',
        amount: 1490.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(210),
        lastChargeDate: dateStr(14),
        nextChargeDate: dateStr(-16),
        daysSinceLastUsed: 148,
        usageLevel: 'unused',
        priceHistory: [
          { date: dateStr(210), amount: 1490.00 },
          { date: dateStr(14), amount: 1490.00 },
        ],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 95,
        confidenceScore: 98,
        riskLevel: 'LOW',
        analysisReasoning: 'Cultpass has zero class check-ins or workout sessions in 148 days. ₹1,490/mo recurring spend is pure waste.',
        evidence: [
          '148 days since last workout check-in',
          'Recurring ₹1,490 debit via UPI AutoPay',
          'Within user auto-cancel limit of ₹1,500',
        ],
        createdAt: dateStr(210),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_insurance`,
        userId,
        name: 'Care Health Insurance Policy',
        merchant: 'Care Health Insurance Ltd',
        category: 'insurance',
        amount: 2499.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(720),
        lastChargeDate: dateStr(2),
        nextChargeDate: dateStr(-28),
        daysSinceLastUsed: 240,
        usageLevel: 'unused',
        priceHistory: [{ date: dateStr(720), amount: 2499.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 0,
        confidenceScore: 99,
        riskLevel: 'HIGH',
        analysisReasoning: 'Critical medical insurance policy (#CH-88219). Protected by invariant policy rules.',
        evidence: ['Protected category: insurance', 'Active health policy for openings.1309@gmail.com'],
        createdAt: dateStr(720),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_hostinger`,
        userId,
        name: 'Hostinger Cloud VPS Hosting',
        merchant: 'Hostinger International',
        category: 'Cloud Hosting',
        amount: 1899.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(180),
        lastChargeDate: dateStr(9),
        nextChargeDate: dateStr(-21),
        daysSinceLastUsed: 8,
        usageLevel: 'medium',
        previousAmount: 1599.00,
        isPriceIncrease: true,
        priceHistory: [
          { date: dateStr(180), amount: 1599.00 },
          { date: dateStr(9), amount: 1899.00 },
        ],
        isTrialConversion: false,
        wasteScore: 55,
        confidenceScore: 89,
        riskLevel: 'LOW',
        analysisReasoning: 'Price increased from ₹1,599 to ₹1,899 (+₹300/mo). Exceeds ₹1,500 auto limit; routed to Review Center.',
        evidence: ['Price increase notice verified in Gmail inbox', 'Charge of ₹1,899 exceeds ₹1,500 auto threshold'],
        createdAt: dateStr(180),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_swiggy`,
        userId,
        name: 'Swiggy One Membership',
        merchant: 'Bundl Technologies Pvt Ltd',
        category: 'Food & Grocery',
        amount: 299.00,
        currency: 'INR',
        billingCycle: 'quarterly',
        status: 'active',
        firstSeenDate: dateStr(300),
        lastChargeDate: dateStr(25),
        nextChargeDate: dateStr(-65),
        daysSinceLastUsed: 1,
        usageLevel: 'high',
        priceHistory: [{ date: dateStr(300), amount: 299.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 8,
        confidenceScore: 97,
        riskLevel: 'LOW',
        analysisReasoning: 'Frequent grocery and food orders. Active high-value subscription.',
        evidence: ['7 Swiggy Instamart deliveries this month', 'Estimated delivery fees saved: ₹480'],
        createdAt: dateStr(300),
        updatedAt: new Date().toISOString(),
      },
    ];

    const guardrails = createDefaultGuardrails(userId);

    const transactions: Transaction[] = [
      {
        id: `txn_${userId}_1`,
        userId,
        date: dateStr(0),
        amount: 829.00,
        currency: 'INR',
        merchant: 'CHESS.COM LLC',
        category: 'Gaming & Education',
        accountName: 'HDFC Bank Regalia ••4819',
        description: 'UPI/AutoPay/chess.com/HDFC0001',
        isRecurring: true,
        subscriptionId: `sub_${userId}_chess`,
      },
      {
        id: `txn_${userId}_2`,
        userId,
        date: dateStr(1),
        amount: 210.00,
        currency: 'INR',
        merchant: 'GOOGLE PLAY STORE',
        category: 'Cloud Storage',
        accountName: 'HDFC Bank Regalia ••4819',
        description: 'GOOGLE*ONE 200GB openings.1309',
        isRecurring: true,
        subscriptionId: `sub_${userId}_googleone`,
      },
      {
        id: `txn_${userId}_3`,
        userId,
        date: dateStr(2),
        amount: 2499.00,
        currency: 'INR',
        merchant: 'CARE HEALTH INSURANCE',
        category: 'Insurance',
        accountName: 'Axis Bank Salary ••9022',
        description: 'NACH/CAREHEALTH/CH-88219/AXIS0009',
        isRecurring: true,
        subscriptionId: `sub_${userId}_insurance`,
      },
      {
        id: `txn_${userId}_4`,
        userId,
        date: dateStr(5),
        amount: 119.00,
        currency: 'INR',
        merchant: 'SPOTIFY INDIA',
        category: 'Music',
        accountName: 'ICICI Bank Coral ••3104',
        description: 'POS/SPOTIFY INDIA MUMBAI',
        isRecurring: true,
        subscriptionId: `sub_${userId}_spotify`,
      },
      {
        id: `txn_${userId}_5`,
        userId,
        date: dateStr(9),
        amount: 1899.00,
        currency: 'INR',
        merchant: 'HOSTINGER HOSTING',
        category: 'Cloud Hosting',
        accountName: 'HDFC Bank Regalia ••4819',
        description: 'PG/HOSTINGER CYPRUS/INR-1899',
        isRecurring: true,
        subscriptionId: `sub_${userId}_hostinger`,
      },
      {
        id: `txn_${userId}_6`,
        userId,
        date: dateStr(10),
        amount: 149.00,
        currency: 'INR',
        merchant: 'AMAZON PRIME INDIA',
        category: 'Entertainment',
        accountName: 'Amazon Pay ICICI ••7781',
        description: 'Amazon Prime Member Recurring',
        isRecurring: true,
        subscriptionId: `sub_${userId}_prime`,
      },
      {
        id: `txn_${userId}_7`,
        userId,
        date: dateStr(14),
        amount: 1490.00,
        currency: 'INR',
        merchant: 'CUREFIT HEALTHCARE',
        category: 'Fitness',
        accountName: 'HDFC Bank Regalia ••4819',
        description: 'UPI/AutoPay/cultfit/HDFC0001',
        isRecurring: true,
        subscriptionId: `sub_${userId}_cultfit`,
      },
      {
        id: `txn_${userId}_8`,
        userId,
        date: dateStr(18),
        amount: 299.00,
        currency: 'INR',
        merchant: 'DISNEY PLUS HOTSTAR',
        category: 'Entertainment',
        accountName: 'HDFC Bank Regalia ••4819',
        description: 'SI/NOVI DIGITAL HOTSTAR MUMBAI',
        isRecurring: true,
        subscriptionId: `sub_${userId}_hotstar`,
      },
      {
        id: `txn_${userId}_9`,
        userId,
        date: dateStr(22),
        amount: 99.00,
        currency: 'INR',
        merchant: 'APPLE SERVICES INDIA',
        category: 'Music',
        accountName: 'HDFC Bank Regalia ••4819',
        description: 'APPLE.COM/BILL BANGALORE',
        isRecurring: true,
        subscriptionId: `sub_${userId}_applemusic`,
      },
    ];

    const emails: SimulatedEmail[] = [
      {
        id: `em_${userId}_1`,
        sender: 'membership@chess.com',
        subject: 'Chess.com Diamond: Your monthly membership receipt (₹829.00)',
        snippet: 'Thank you for playing on Chess.com! Your Diamond Plan renewed successfully for ₹829.00.',
        date: dateStr(12),
        merchant: 'Chess.com',
        extractedData: { amount: 829.00, isPriceIncrease: false },
      },
      {
        id: `em_${userId}_2`,
        sender: 'billing@hostinger.com',
        subject: 'Invoice #HST-991204: Hostinger VPS renewal at ₹1,899.00',
        snippet: 'Your Cloud VPS renewed at ₹1,899/month (previously ₹1,599). Your service is active.',
        date: dateStr(9),
        merchant: 'Hostinger',
        extractedData: { amount: 1899.00, isPriceIncrease: true, previousAmount: 1599.00 },
      },
      {
        id: `em_${userId}_3`,
        sender: 'notifications@cult.fit',
        subject: 'Your Cultpass LIVE renewal of ₹1,490 was processed',
        snippet: 'Your monthly Cultpass membership has been renewed. We noticed you haven\'t booked a class recently!',
        date: dateStr(14),
        merchant: 'Curefit',
        extractedData: { amount: 1490.00, isPriceIncrease: false },
      },
      {
        id: `em_${userId}_4`,
        sender: 'customer.care@careinsurance.com',
        subject: 'Care Health Insurance: Premium Paid for Policy CH-88219 (₹2,499.00)',
        snippet: 'We acknowledge receipt of your monthly premium ₹2,499.00 for Care Comprehensive Plan.',
        date: dateStr(2),
        merchant: 'Care Health Insurance',
        extractedData: { amount: 2499.00, isPriceIncrease: false },
      },
    ];

    const reviewQueue: ReviewQueueItem[] = [
      {
        id: `rev_${userId}_music`,
        userId,
        subscriptionId: `sub_${userId}_applemusic`,
        subscriptionName: 'Apple Music India',
        category: 'Music',
        amount: 99.00,
        currency: 'INR',
        reason: 'DUPLICATE_SERVICES',
        description: 'Apple Music (₹99/mo) overlaps with Spotify Premium (₹119/mo). Apple Music has not been played in 54 days.',
        status: 'pending',
        suggestedAction: 'CANCEL_THIS',
        potentialSavings: 99.00,
        overlappingSubscription: {
          id: `sub_${userId}_spotify`,
          name: 'Spotify Premium Individual',
          amount: 119.00,
          currency: 'INR',
        },
        createdAt: dateStr(1),
      },
      {
        id: `rev_${userId}_hostinger`,
        userId,
        subscriptionId: `sub_${userId}_hostinger`,
        subscriptionName: 'Hostinger Cloud VPS Hosting',
        category: 'Cloud Hosting',
        amount: 1899.00,
        currency: 'INR',
        reason: 'EXCEEDS_AUTO_LIMIT',
        description: 'Hostinger increased price by ₹300/mo (to ₹1,899/mo), exceeding your automatic limit of ₹1,500.00.',
        status: 'pending',
        suggestedAction: 'NEGOTIATE',
        potentialSavings: 300.00,
        createdAt: dateStr(2),
      },
    ];

    const actions: ActionRecord[] = [];
    const auditLogs: AuditLog[] = [
      {
        id: `aud_${Date.now()}_init`,
        userId,
        timestamp: new Date().toISOString(),
        eventType: 'USER_LOGIN',
        entityId: userId,
        entityType: 'user',
        description: `Secure Money telemetry extracted and synchronized for ${userId}. 10 active subscriptions parsed.`,
        severity: 'info',
        metadata: { extractedFrom: 'HDFC NetBanking, ICICI UPI, Gmail Invoices' },
      },
    ];

    return { subscriptions: subs, guardrails, actions, auditLogs, reviewQueue, transactions, emails };
  }

  // SPECIAL PERSONA 2: priya.verma@techcorp.in (Tech Executive profile)
  if (lowerUser.includes('priya') || lowerUser.includes('corporate')) {
    const subs: Subscription[] = [
      {
        id: `sub_${userId}_netflix`,
        userId,
        name: 'Netflix India 4K Premium',
        merchant: 'Netflix Entertainment India',
        category: 'Entertainment',
        amount: 649.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(500),
        lastChargeDate: dateStr(6),
        nextChargeDate: dateStr(-24),
        daysSinceLastUsed: 1,
        usageLevel: 'high',
        priceHistory: [{ date: dateStr(500), amount: 649.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 10,
        confidenceScore: 98,
        riskLevel: 'LOW',
        analysisReasoning: 'Actively streamed 4K content yesterday.',
        evidence: ['Active streaming session yesterday (3.1 hours)'],
        createdAt: dateStr(500),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_chatgpt`,
        userId,
        name: 'ChatGPT Plus (OpenAI)',
        merchant: 'OpenAI LLC',
        category: 'Productivity & AI',
        amount: 1999.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(300),
        lastChargeDate: dateStr(8),
        nextChargeDate: dateStr(-22),
        daysSinceLastUsed: 0,
        usageLevel: 'high',
        priceHistory: [{ date: dateStr(300), amount: 1999.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        duplicateGroup: 'ai_assistants',
        overlappingWith: [`sub_${userId}_claudepro`],
        wasteScore: 15,
        confidenceScore: 95,
        riskLevel: 'MEDIUM',
        analysisReasoning: 'Active daily AI coding and research usage. Overlaps with Claude Pro (₹1,999/mo).',
        evidence: ['45 prompt sessions today', 'Duplicate assistant subscription active'],
        createdAt: dateStr(300),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_claudepro`,
        userId,
        name: 'Claude Pro Team',
        merchant: 'Anthropic PBC',
        category: 'Productivity & AI',
        amount: 1999.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(120),
        lastChargeDate: dateStr(15),
        nextChargeDate: dateStr(-15),
        daysSinceLastUsed: 46,
        usageLevel: 'low',
        priceHistory: [{ date: dateStr(120), amount: 1999.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        duplicateGroup: 'ai_assistants',
        overlappingWith: [`sub_${userId}_chatgpt`],
        wasteScore: 82,
        confidenceScore: 94,
        riskLevel: 'MEDIUM',
        analysisReasoning: 'No queries in 46 days while ChatGPT Plus is used daily. Duplicate AI tool.',
        evidence: ['46 days of zero API or chat usage', 'Overlaps with active ChatGPT Plus (₹1,999/mo)'],
        createdAt: dateStr(120),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_starhealth`,
        userId,
        name: 'Star Health Family Optima',
        merchant: 'Star Health and Allied Insurance',
        category: 'insurance',
        amount: 3850.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(800),
        lastChargeDate: dateStr(3),
        nextChargeDate: dateStr(-27),
        daysSinceLastUsed: 300,
        usageLevel: 'unused',
        priceHistory: [{ date: dateStr(800), amount: 3850.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 0,
        confidenceScore: 99,
        riskLevel: 'HIGH',
        analysisReasoning: 'Family health coverage. Protected invariant.',
        evidence: ['Category: insurance', 'Protected policy'],
        createdAt: dateStr(800),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_cultelite`,
        userId,
        name: 'Cultpass Elite Center Membership',
        merchant: 'Curefit Healthcare Pvt Ltd',
        category: 'Fitness',
        amount: 2450.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(180),
        lastChargeDate: dateStr(11),
        nextChargeDate: dateStr(-19),
        daysSinceLastUsed: 92,
        usageLevel: 'unused',
        priceHistory: [{ date: dateStr(180), amount: 2450.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 92,
        confidenceScore: 96,
        riskLevel: 'LOW',
        analysisReasoning: 'No gym scans in 92 days. Amount (₹2,450) exceeds ₹1,500 auto-limit -> Review Center.',
        evidence: ['92 days zero gym attendance', 'Exceeds auto-limit ₹1,500'],
        createdAt: dateStr(180),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_notion`,
        userId,
        name: 'Notion Team Workspace',
        merchant: 'Notion Labs Inc',
        category: 'Productivity',
        amount: 1650.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(240),
        lastChargeDate: dateStr(14),
        nextChargeDate: dateStr(-16),
        daysSinceLastUsed: 2,
        usageLevel: 'high',
        priceHistory: [{ date: dateStr(240), amount: 1650.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 10,
        confidenceScore: 97,
        riskLevel: 'LOW',
        analysisReasoning: 'Active daily documentation and sprint planning.',
        evidence: ['Daily document edits'],
        createdAt: dateStr(240),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_jiofiber`,
        userId,
        name: 'JioFiber 300 Mbps Plan',
        merchant: 'Reliance Jio Infocomm',
        category: 'Broadband & Utilities',
        amount: 1499.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(360),
        lastChargeDate: dateStr(4),
        nextChargeDate: dateStr(-26),
        daysSinceLastUsed: 0,
        usageLevel: 'high',
        priceHistory: [{ date: dateStr(360), amount: 1499.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 5,
        confidenceScore: 99,
        riskLevel: 'LOW',
        analysisReasoning: 'Primary home gigabit internet connection.',
        evidence: ['Daily data consumption 28GB'],
        createdAt: dateStr(360),
        updatedAt: new Date().toISOString(),
      },
    ];

    const guardrails = createDefaultGuardrails(userId);
    const transactions: Transaction[] = [
      {
        id: `txn_${userId}_1`,
        userId,
        date: dateStr(3),
        amount: 3850.00,
        currency: 'INR',
        merchant: 'STAR HEALTH INSURANCE',
        category: 'Insurance',
        accountName: 'HDFC Imperia ••1902',
        description: 'ACH DEBIT STAR HEALTH CHENNAI',
        isRecurring: true,
        subscriptionId: `sub_${userId}_starhealth`,
      },
      {
        id: `txn_${userId}_2`,
        userId,
        date: dateStr(6),
        amount: 649.00,
        currency: 'INR',
        merchant: 'NETFLIX INDIA',
        category: 'Entertainment',
        accountName: 'HDFC Imperia ••1902',
        description: 'NETFLIX ENTERTAINMENT IN',
        isRecurring: true,
        subscriptionId: `sub_${userId}_netflix`,
      },
      {
        id: `txn_${userId}_3`,
        userId,
        date: dateStr(8),
        amount: 1999.00,
        currency: 'INR',
        merchant: 'OPENAI CHATGPT PLUS',
        category: 'Productivity',
        accountName: 'ICICI Sapphiro ••9912',
        description: 'OPENAI SAN FRANCISCO CA',
        isRecurring: true,
        subscriptionId: `sub_${userId}_chatgpt`,
      },
    ];

    const reviewQueue: ReviewQueueItem[] = [
      {
        id: `rev_${userId}_claude`,
        userId,
        subscriptionId: `sub_${userId}_claudepro`,
        subscriptionName: 'Claude Pro Team',
        category: 'Productivity & AI',
        amount: 1999.00,
        currency: 'INR',
        reason: 'DUPLICATE_SERVICES',
        description: 'Claude Pro (₹1,999/mo) overlaps with active ChatGPT Plus (₹1,999/mo). Unused for 46 days.',
        status: 'pending',
        suggestedAction: 'CANCEL_THIS',
        potentialSavings: 1999.00,
        overlappingSubscription: {
          id: `sub_${userId}_chatgpt`,
          name: 'ChatGPT Plus (OpenAI)',
          amount: 1999.00,
          currency: 'INR',
        },
        createdAt: dateStr(2),
      },
      {
        id: `rev_${userId}_cult`,
        userId,
        subscriptionId: `sub_${userId}_cultelite`,
        subscriptionName: 'Cultpass Elite Center Membership',
        category: 'Fitness',
        amount: 2450.00,
        currency: 'INR',
        reason: 'EXCEEDS_AUTO_LIMIT',
        description: 'Unused for 92 days. Amount (₹2,450.00) exceeds maximum automatic limit of ₹1,500.00.',
        status: 'pending',
        suggestedAction: 'CANCEL',
        potentialSavings: 2450.00,
        createdAt: dateStr(1),
      },
    ];

    return {
      subscriptions: subs,
      guardrails,
      actions: [],
      auditLogs: [
        {
          id: `aud_${Date.now()}_priya`,
          userId,
          timestamp: new Date().toISOString(),
          eventType: 'USER_LOGIN',
          entityId: userId,
          entityType: 'user',
          description: `Extracted executive telemetry for ${userId}. Total recurring monthly spend: ₹14,096.00.`,
          severity: 'info',
        },
      ],
      reviewQueue,
      transactions,
      emails: [],
    };
  }

  // DEFAULT / SEED PERSONA: user_guardian_default or alex.smith@fintech.io
  if (lowerUser === DEFAULT_USER_ID || lowerUser.includes('alex') || lowerUser.includes('default')) {
    const subs: Subscription[] = [
      {
        id: `sub_${userId}_streamflix`,
        userId,
        name: 'StreamFlix India',
        merchant: 'StreamFlix Media',
        category: 'Entertainment',
        amount: 499.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(365),
        lastChargeDate: dateStr(15),
        nextChargeDate: dateStr(-15),
        daysSinceLastUsed: 187,
        usageLevel: 'unused',
        priceHistory: [
          { date: dateStr(365), amount: 499.00 },
          { date: dateStr(180), amount: 499.00 },
          { date: dateStr(15), amount: 499.00 },
        ],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 96,
        confidenceScore: 98,
        riskLevel: 'LOW',
        analysisReasoning: 'StreamFlix has not been streamed or opened in 187 days. Charges recur monthly at ₹499.00.',
        evidence: [
          '187 days since last streaming event',
          '6 consecutive unused monthly charges of ₹499.00',
          'Within configured auto-limit of ₹1,500.00',
          'Not a protected category',
        ],
        createdAt: dateStr(365),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_tunewave`,
        userId,
        name: 'TuneWave Music',
        merchant: 'TuneWave Music Inc.',
        category: 'Music',
        amount: 119.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(210),
        lastChargeDate: dateStr(8),
        nextChargeDate: dateStr(-22),
        daysSinceLastUsed: 4,
        usageLevel: 'high',
        priceHistory: [
          { date: dateStr(210), amount: 119.00 },
          { date: dateStr(8), amount: 119.00 },
        ],
        isTrialConversion: false,
        isPriceIncrease: false,
        duplicateGroup: 'music_streaming',
        overlappingWith: [`sub_${userId}_musicbox`],
        wasteScore: 15,
        confidenceScore: 92,
        riskLevel: 'MEDIUM',
        analysisReasoning: 'TuneWave was used 4 days ago. Overlaps with MusicBox Premium (₹149.00) in the same category.',
        evidence: ['Active playback 4 days ago', 'Duplicate service detected: MusicBox Premium (₹149.00)'],
        createdAt: dateStr(210),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_musicbox`,
        userId,
        name: 'MusicBox Premium',
        merchant: 'MusicBox Digital',
        category: 'Music',
        amount: 149.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(400),
        lastChargeDate: dateStr(20),
        nextChargeDate: dateStr(-10),
        daysSinceLastUsed: 40,
        usageLevel: 'low',
        priceHistory: [{ date: dateStr(400), amount: 149.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        duplicateGroup: 'music_streaming',
        overlappingWith: [`sub_${userId}_tunewave`],
        wasteScore: 68,
        confidenceScore: 90,
        riskLevel: 'MEDIUM',
        analysisReasoning: 'Overlaps with TuneWave. Requires user confirmation to avoid terminating preferred library.',
        evidence: ['Duplicate music streaming service', 'User library preference unknown'],
        createdAt: dateStr(400),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_healthguard`,
        userId,
        name: 'HealthGuard Insurance',
        merchant: 'HealthGuard Mutual',
        category: 'insurance',
        amount: 2499.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(700),
        lastChargeDate: dateStr(1),
        nextChargeDate: dateStr(-29),
        daysSinceLastUsed: 300,
        usageLevel: 'unused',
        priceHistory: [{ date: dateStr(700), amount: 2499.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 0,
        confidenceScore: 99,
        riskLevel: 'HIGH',
        analysisReasoning: 'Health insurance policy. Protected category invariant strictly prohibits automatic modification.',
        evidence: ['Protected category: insurance', 'Active medical policy'],
        createdAt: dateStr(700),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_adobe`,
        userId,
        name: 'Adobe Creative Cloud',
        merchant: 'Adobe Systems India',
        category: 'Software & Design',
        amount: 4230.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(500),
        lastChargeDate: dateStr(10),
        nextChargeDate: dateStr(-20),
        daysSinceLastUsed: 14,
        usageLevel: 'medium',
        previousAmount: 3880.00,
        isPriceIncrease: true,
        priceHistory: [
          { date: dateStr(500), amount: 3880.00 },
          { date: dateStr(10), amount: 4230.00 },
        ],
        isTrialConversion: false,
        wasteScore: 45,
        confidenceScore: 88,
        riskLevel: 'LOW',
        analysisReasoning: 'Price increased from ₹3,880.00 to ₹4,230.00 (+₹350/mo). Exceeds auto limit.',
        evidence: ['Price increase signal extracted from billing receipt', 'Eligible for retention discount draft'],
        createdAt: dateStr(500),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_dropbox`,
        userId,
        name: 'Dropbox Plus',
        merchant: 'Dropbox Inc',
        category: 'Cloud Storage',
        amount: 820.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(290),
        lastChargeDate: dateStr(18),
        nextChargeDate: dateStr(-12),
        daysSinceLastUsed: 22,
        usageLevel: 'low',
        priceHistory: [{ date: dateStr(290), amount: 820.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 50,
        confidenceScore: 87,
        riskLevel: 'LOW',
        analysisReasoning: 'Storage consumption is 12GB out of 2TB. Eligible for tier downgrade to save ₹550/mo.',
        evidence: ['Low cloud utilization (0.6% quota used)', 'Downgrade recommendation available'],
        createdAt: dateStr(290),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_fitlife`,
        userId,
        name: 'FitLife Gym Online',
        merchant: 'FitLife Global',
        category: 'Fitness',
        amount: 999.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'cancelled',
        firstSeenDate: dateStr(200),
        lastChargeDate: dateStr(45),
        nextChargeDate: dateStr(15),
        daysSinceLastUsed: 110,
        usageLevel: 'unused',
        priceHistory: [{ date: dateStr(200), amount: 999.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 92,
        confidenceScore: 95,
        riskLevel: 'LOW',
        analysisReasoning: 'Successfully cancelled by autonomous guardian action.',
        evidence: ['Cancellation verified via confirmation receipt'],
        createdAt: dateStr(200),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `sub_${userId}_aws`,
        userId,
        name: 'AWS Cloud Compute',
        merchant: 'Amazon Web Services India',
        category: 'Cloud',
        amount: 2850.00,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'active',
        firstSeenDate: dateStr(340),
        lastChargeDate: dateStr(5),
        nextChargeDate: dateStr(-25),
        daysSinceLastUsed: 1,
        usageLevel: 'high',
        priceHistory: [{ date: dateStr(340), amount: 2850.00 }],
        isTrialConversion: false,
        isPriceIncrease: false,
        wasteScore: 10,
        confidenceScore: 98,
        riskLevel: 'LOW',
        analysisReasoning: 'Production container hosting.',
        evidence: ['Continuous uptime telemetry'],
        createdAt: dateStr(340),
        updatedAt: new Date().toISOString(),
      },
    ];

    const guardrails = createDefaultGuardrails(userId);
    const transactions: Transaction[] = [
      {
        id: `txn_${userId}_1`,
        userId,
        date: dateStr(1),
        amount: 2499.00,
        currency: 'INR',
        merchant: 'HEALTHGUARD MUTUAL',
        category: 'Insurance',
        accountName: 'HDFC Regalia ••8819',
        description: 'NACH/HEALTHGUARD/POL-9921',
        isRecurring: true,
        subscriptionId: `sub_${userId}_healthguard`,
      },
      {
        id: `txn_${userId}_2`,
        userId,
        date: dateStr(5),
        amount: 2850.00,
        currency: 'INR',
        merchant: 'AMAZON WEB SERVICES',
        category: 'Cloud',
        accountName: 'HDFC Regalia ••8819',
        description: 'AWS CLOUD SERVICES INDIA',
        isRecurring: true,
        subscriptionId: `sub_${userId}_aws`,
      },
      {
        id: `txn_${userId}_3`,
        userId,
        date: dateStr(8),
        amount: 119.00,
        currency: 'INR',
        merchant: 'TUNEWAVE MUSIC',
        category: 'Music',
        accountName: 'ICICI Coral ••4412',
        description: 'TUNEWAVE SUBSCRIPTION',
        isRecurring: true,
        subscriptionId: `sub_${userId}_tunewave`,
      },
      {
        id: `txn_${userId}_4`,
        userId,
        date: dateStr(10),
        amount: 4230.00,
        currency: 'INR',
        merchant: 'ADOBE SYSTEMS INDIA',
        category: 'Software',
        accountName: 'HDFC Regalia ••8819',
        description: 'ADOBE CREATIVE CLOUD MONTHLY',
        isRecurring: true,
        subscriptionId: `sub_${userId}_adobe`,
      },
      {
        id: `txn_${userId}_5`,
        userId,
        date: dateStr(15),
        amount: 499.00,
        currency: 'INR',
        merchant: 'STREAMFLIX MEDIA',
        category: 'Entertainment',
        accountName: 'HDFC Regalia ••8819',
        description: 'STREAMFLIX INDIA SUBSCRIPTION',
        isRecurring: true,
        subscriptionId: `sub_${userId}_streamflix`,
      },
    ];

    const actions: ActionRecord[] = [
      {
        actionId: `act_${userId}_fitlife`,
        idempotencyKey: `idem_fitlife_cancel_${dateStr(30)}`,
        userId,
        subscriptionId: `sub_${userId}_fitlife`,
        subscriptionName: 'FitLife Gym Online',
        amount: 999.00,
        decisionId: 'dec_init_fitlife',
        actionType: 'AUTO_CANCEL',
        guardrailResult: 'passed',
        timestamp: dateStr(30),
        executionStatus: 'verified',
        simulated: true,
        verificationResult: {
          verified: true,
          verifiedAt: dateStr(30),
          merchantResponse: 'Subscription cancelled per automated mandate API.',
          confirmationCode: 'FL-CANCEL-99120',
          verificationMethod: 'merchant_api',
        },
      },
    ];

    const reviewQueue: ReviewQueueItem[] = [
      {
        id: `rev_${userId}_musicbox`,
        userId,
        subscriptionId: `sub_${userId}_musicbox`,
        subscriptionName: 'MusicBox Premium',
        category: 'Music',
        amount: 149.00,
        currency: 'INR',
        reason: 'DUPLICATE_SERVICES',
        description: 'Overlaps with TuneWave Music (₹119.00). Unused for 40 days.',
        status: 'pending',
        suggestedAction: 'CANCEL_THIS',
        potentialSavings: 149.00,
        overlappingSubscription: {
          id: `sub_${userId}_tunewave`,
          name: 'TuneWave Music',
          amount: 119.00,
          currency: 'INR',
        },
        createdAt: dateStr(3),
      },
      {
        id: `rev_${userId}_adobe`,
        userId,
        subscriptionId: `sub_${userId}_adobe`,
        subscriptionName: 'Adobe Creative Cloud',
        category: 'Software & Design',
        amount: 4230.00,
        currency: 'INR',
        reason: 'PRICE_INCREASE',
        description: 'Price increased by ₹350/mo. Negotiation letter draft ready.',
        status: 'pending',
        suggestedAction: 'NEGOTIATE',
        potentialSavings: 350.00,
        createdAt: dateStr(2),
      },
    ];

    return {
      subscriptions: subs,
      guardrails,
      actions,
      auditLogs: [
        {
          id: `aud_${Date.now()}_default`,
          userId,
          timestamp: new Date().toISOString(),
          eventType: 'USER_LOGIN',
          entityId: userId,
          entityType: 'user',
          description: `Extracted telemetry for ${userId}. Total spend: ₹11,845.00/mo. 1 active cancellation verified.`,
          severity: 'info',
        },
      ],
      reviewQueue,
      transactions,
      emails: [],
    };
  }

  // DYNAMIC ALGORITHMIC PERSONA for any other arbitrary email or user ID
  // Hashes the user's string to generate deterministic, unique spending, merchants, and telemetry!
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const INDIAN_CATALOG = [
    { name: 'SonyLIV Premium', merchant: 'Culver Max Entertainment', category: 'Entertainment', amount: 299.00 },
    { name: 'Zee5 All-Access', merchant: 'Zee Entertainment', category: 'Entertainment', amount: 149.00 },
    { name: 'Times Prime Annual', merchant: 'Times Internet', category: 'Lifestyle', amount: 100.00 },
    { name: 'Gaana Plus', merchant: 'Gamma Gaana Ltd', category: 'Music', amount: 99.00 },
    { name: 'JioSaavn Pro', merchant: 'Reliance Jio', category: 'Music', amount: 99.00 },
    { name: 'The Ken Journalism', merchant: 'Ken Digital Media', category: 'News & Media', amount: 275.00 },
    { name: 'GitHub Copilot Individual', merchant: 'GitHub Inc', category: 'Developer Tools', amount: 850.00 },
    { name: 'Microsoft 365 Personal', merchant: 'Microsoft India', category: 'Productivity', amount: 489.00 },
    { name: 'Anytime Fitness Club', merchant: 'Anytime Fitness India', category: 'Fitness', amount: 2200.00 },
    { name: 'HDFC ERGO Health Suraksha', merchant: 'HDFC ERGO General Insurance', category: 'insurance', amount: 2850.00 },
    { name: 'Zomato Gold', merchant: 'Zomato Limited', category: 'Food & Dining', amount: 100.00 },
    { name: 'Swiggy One', merchant: 'Bundl Technologies', category: 'Food & Grocery', amount: 100.00 },
    { name: 'Google One 100GB', merchant: 'Google Cloud India', category: 'Cloud Storage', amount: 130.00 },
    { name: 'Canva Pro India', merchant: 'Canva Pty Ltd', category: 'Design', amount: 499.00 },
    { name: 'Disney+ Hotstar', merchant: 'Novi Digital', category: 'Entertainment', amount: 299.00 },
    { name: 'Amazon Prime', merchant: 'Amazon Seller Services', category: 'Entertainment', amount: 125.00 },
  ];

  // Pick 6 to 9 items deterministically based on hash
  const numSubs = 6 + (absHash % 4); // 6, 7, 8, or 9
  const subs: Subscription[] = [];
  const transactions: Transaction[] = [];

  for (let i = 0; i < numSubs; i++) {
    const item = INDIAN_CATALOG[(absHash + i * 3) % INDIAN_CATALOG.length];
    const subId = `sub_${userId}_${i}`;
    const daysUnused = (absHash * (i + 1)) % 160;
    const isInsurance = item.category.toLowerCase() === 'insurance';
    const waste = isInsurance ? 0 : daysUnused > 90 ? 92 : daysUnused > 40 ? 65 : 12;
    const usage = daysUnused > 60 ? 'unused' : daysUnused > 20 ? 'low' : 'high';

    subs.push({
      id: subId,
      userId,
      name: item.name,
      merchant: item.merchant,
      category: item.category,
      amount: item.amount,
      currency: 'INR',
      billingCycle: 'monthly',
      status: 'active',
      firstSeenDate: dateStr(200 + (i * 30)),
      lastChargeDate: dateStr(10 + (i * 2)),
      nextChargeDate: dateStr(-20 + (i * 2)),
      daysSinceLastUsed: daysUnused,
      usageLevel: usage as any,
      priceHistory: [{ date: dateStr(200 + (i * 30)), amount: item.amount }],
      isTrialConversion: false,
      isPriceIncrease: false,
      wasteScore: waste,
      confidenceScore: 92,
      riskLevel: isInsurance ? 'HIGH' : 'LOW',
      analysisReasoning: isInsurance
        ? 'Protected insurance policy.'
        : daysUnused > 60
        ? `Unused for ${daysUnused} days.`
        : 'Actively used subscription.',
      evidence: [`${daysUnused} days since last interaction`],
      createdAt: dateStr(200 + (i * 30)),
      updatedAt: new Date().toISOString(),
    });

    transactions.push({
      id: `txn_${userId}_${i}`,
      userId,
      date: dateStr(5 + i),
      amount: item.amount,
      currency: 'INR',
      merchant: item.merchant.toUpperCase(),
      category: item.category,
      accountName: 'State Bank of India ••2910',
      description: `UPI/AUTOPAY/${item.merchant.replace(/\s+/g, '').toUpperCase()}`,
      isRecurring: true,
      subscriptionId: subId,
    });
  }

  const guardrails = createDefaultGuardrails(userId);

  return {
    subscriptions: subs,
    guardrails,
    actions: [],
    auditLogs: [
      {
        id: `aud_${Date.now()}_dyn`,
        userId,
        timestamp: new Date().toISOString(),
        eventType: 'USER_LOGIN',
        entityId: userId,
        entityType: 'user',
        description: `Extracted personal telemetry for ${userId}. Parsed ${subs.length} active Indian recurring services.`,
        severity: 'info',
      },
    ],
    reviewQueue: [],
    transactions,
    emails: [],
  };
}

export class Store {
  private data: StoreData;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): StoreData {
    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        // Ensure guardrails is a record
        if (parsed.guardrails && !parsed.guardrails[DEFAULT_USER_ID] && parsed.guardrails.maxAutoAmount) {
          parsed.guardrails = { [DEFAULT_USER_ID]: parsed.guardrails };
        }
        if (!parsed.guardrails) {
          parsed.guardrails = {};
        }

        // Deduplicate all collections by unique ID
        if (Array.isArray(parsed.subscriptions)) {
          const seenSubIds = new Set<string>();
          parsed.subscriptions = parsed.subscriptions.filter((s: Subscription) => {
            if (!s || !s.id || seenSubIds.has(s.id)) return false;
            seenSubIds.add(s.id);
            return true;
          });
        }
        if (Array.isArray(parsed.reviewQueue)) {
          const seenRevIds = new Set<string>();
          parsed.reviewQueue = parsed.reviewQueue.filter((r: ReviewQueueItem) => {
            if (!r || !r.id || seenRevIds.has(r.id)) return false;
            seenRevIds.add(r.id);
            return true;
          });
        }
        if (Array.isArray(parsed.transactions)) {
          const seenTxnIds = new Set<string>();
          parsed.transactions = parsed.transactions.filter((t: Transaction) => {
            if (!t || !t.id || seenTxnIds.has(t.id)) return false;
            seenTxnIds.add(t.id);
            return true;
          });
        }
        if (Array.isArray(parsed.actions)) {
          const seenActIds = new Set<string>();
          parsed.actions = parsed.actions.filter((a: ActionRecord) => {
            if (!a || !a.actionId || seenActIds.has(a.actionId)) return false;
            seenActIds.add(a.actionId);
            return true;
          });
        }
        if (Array.isArray(parsed.auditLogs)) {
          const seenLogIds = new Set<string>();
          parsed.auditLogs = parsed.auditLogs.filter((l: AuditLog) => {
            if (!l || !l.id || seenLogIds.has(l.id)) return false;
            seenLogIds.add(l.id);
            return true;
          });
        }

        return parsed;
      } catch (err) {
        console.error('Failed to parse guardian_store.json, creating new seed:', err);
      }
    }
    const seed = this.generateInitialStore();
    this.saveData(seed);
    return seed;
  }

  private generateInitialStore(): StoreData {
    const defaultData = generateUserData(DEFAULT_USER_ID);
    const openingsData = generateUserData('openings.1309@gmail.com');
    const priyaData = generateUserData('priya.verma@techcorp.in');

    return {
      subscriptions: [
        ...defaultData.subscriptions,
        ...openingsData.subscriptions,
        ...priyaData.subscriptions,
      ],
      guardrails: {
        [DEFAULT_USER_ID]: defaultData.guardrails,
        ['openings.1309@gmail.com']: openingsData.guardrails,
        ['priya.verma@techcorp.in']: priyaData.guardrails,
      },
      actions: [
        ...defaultData.actions,
        ...openingsData.actions,
        ...priyaData.actions,
      ],
      auditLogs: [
        ...defaultData.auditLogs,
        ...openingsData.auditLogs,
        ...priyaData.auditLogs,
      ],
      reviewQueue: [
        ...defaultData.reviewQueue,
        ...openingsData.reviewQueue,
        ...priyaData.reviewQueue,
      ],
      transactions: [
        ...defaultData.transactions,
        ...openingsData.transactions,
        ...priyaData.transactions,
      ],
      emails: [
        ...defaultData.emails,
        ...openingsData.emails,
      ],
      connections: [
        {
          id: 'conn_hdfc',
          name: 'HDFC Bank & NetBanking Feed',
          type: 'banking',
          status: 'connected',
          lastSyncTime: new Date().toISOString(),
          itemCount: 14,
        },
        {
          id: 'conn_icici',
          name: 'ICICI Bank UPI & Cards',
          type: 'banking',
          status: 'connected',
          lastSyncTime: new Date().toISOString(),
          itemCount: 8,
        },
        {
          id: 'conn_phonepe',
          name: 'PhonePe UPI AutoPay & Mandates',
          type: 'payment_app',
          status: 'connected',
          lastSyncTime: new Date().toISOString(),
          itemCount: 6,
          appId: 'phonepe',
          mandatesCount: 4,
          permissions: ['read_mandates', 'read_sms_alerts', 'monitor_autopay'],
        },
        {
          id: 'conn_gpay',
          name: 'Google Pay (G-Pay) UPI Mandates',
          type: 'payment_app',
          status: 'connected',
          lastSyncTime: new Date().toISOString(),
          itemCount: 5,
          appId: 'gpay',
          mandatesCount: 3,
          permissions: ['read_mandates', 'read_play_subscriptions', 'monitor_autopay'],
        },
        {
          id: 'conn_paytm',
          name: 'Paytm UPI & Wallet Auto-Debit',
          type: 'payment_app',
          status: 'connected',
          lastSyncTime: new Date().toISOString(),
          itemCount: 3,
          appId: 'paytm',
          mandatesCount: 2,
          permissions: ['read_mandates', 'read_wallet_sub'],
        },
        {
          id: 'conn_cred',
          name: 'CRED UPI & Card AutoPay Protect',
          type: 'payment_app',
          status: 'connected',
          lastSyncTime: new Date().toISOString(),
          itemCount: 4,
          appId: 'cred',
          mandatesCount: 2,
          permissions: ['read_mandates', 'protect_autopay'],
        },
        {
          id: 'conn_csv_statement',
          name: 'Bank Statement CSV Direct Import',
          type: 'csv_statement',
          status: 'connected',
          lastSyncTime: new Date().toISOString(),
          itemCount: 12,
        },
        {
          id: 'conn_gmail',
          name: 'Google Workspace / Gmail Receipts',
          type: 'email',
          status: 'connected',
          lastSyncTime: new Date().toISOString(),
          itemCount: 18,
        },
        {
          id: 'conn_device',
          name: 'App Usage & Device Telemetry',
          type: 'usage',
          status: 'connected',
          lastSyncTime: new Date().toISOString(),
          itemCount: 14,
        },
      ],
      lastScanTime: new Date().toISOString(),
    };
  }

  private saveData(data: StoreData): void {
    this.ensureDataDir();
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Ensures that a user has their own partitioned, realistic data.
   * If a user logs in for the first time, their personal profile is synthesized instantly!
   */
  public ensureUserData(userId = DEFAULT_USER_ID): void {
    const hasSubs = this.data.subscriptions.some(s => s.userId === userId);
    if (!hasSubs) {
      const generated = generateUserData(userId);
      this.data.subscriptions.push(...generated.subscriptions);
      this.data.transactions.push(...generated.transactions);
      this.data.emails.push(...generated.emails);
      this.data.actions.push(...generated.actions);
      this.data.auditLogs.push(...generated.auditLogs);
      this.data.reviewQueue.push(...generated.reviewQueue);
      this.data.guardrails[userId] = generated.guardrails;
      this.saveData(this.data);
    }
  }

  // --- Subscriptions ---
  getSubscriptions(userId = DEFAULT_USER_ID): Subscription[] {
    this.ensureUserData(userId);
    return this.data.subscriptions.filter(s => s.userId === userId);
  }

  getSubscription(id: string, userId?: string): Subscription | undefined {
    if (userId) {
      this.ensureUserData(userId);
      const found = this.data.subscriptions.find(s => s.id === id && s.userId === userId);
      if (found) return found;
    }
    // Global search across all active/loaded subscriptions by ID or name
    return (
      this.data.subscriptions.find(s => s.id === id) ||
      this.data.subscriptions.find(s => s.name.toLowerCase() === id.toLowerCase()) ||
      this.data.subscriptions.find(s => s.id.toLowerCase().includes(id.toLowerCase()))
    );
  }

  saveSubscription(sub: Subscription): void {
    const idx = this.data.subscriptions.findIndex(s => s.id === sub.id);
    if (idx >= 0) {
      this.data.subscriptions[idx] = { ...sub, updatedAt: new Date().toISOString() };
    } else {
      this.data.subscriptions.push({ ...sub, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.saveData(this.data);
  }

  deleteSubscription(id: string, userId = DEFAULT_USER_ID): boolean {
    const prevLen = this.data.subscriptions.length;
    this.data.subscriptions = this.data.subscriptions.filter(s => !(s.id === id && s.userId === userId));
    if (this.data.subscriptions.length !== prevLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- Guardrails ---
  getGuardrails(userId = DEFAULT_USER_ID): GuardrailConfig {
    this.ensureUserData(userId);
    if (!this.data.guardrails[userId]) {
      this.data.guardrails[userId] = createDefaultGuardrails(userId);
      this.saveData(this.data);
    }
    return this.data.guardrails[userId];
  }

  updateGuardrails(partial: Partial<GuardrailConfig>, userId = DEFAULT_USER_ID): GuardrailConfig {
    this.ensureUserData(userId);
    const current = this.getGuardrails(userId);
    this.data.guardrails[userId] = {
      ...current,
      ...partial,
      userId,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(this.data);
    return this.data.guardrails[userId];
  }

  // --- Actions ---
  getActions(userId = DEFAULT_USER_ID): ActionRecord[] {
    this.ensureUserData(userId);
    return this.data.actions.filter(a => a.userId === userId);
  }

  getActionById(actionId: string): ActionRecord | undefined {
    return this.data.actions.find(a => a.actionId === actionId);
  }

  getActionByIdempotency(idempotencyKey: string): ActionRecord | undefined {
    return this.data.actions.find(a => a.idempotencyKey === idempotencyKey);
  }

  saveAction(action: ActionRecord): void {
    const idx = this.data.actions.findIndex(a => a.actionId === action.actionId);
    if (idx >= 0) {
      this.data.actions[idx] = action;
    } else {
      this.data.actions.unshift(action);
    }
    this.saveData(this.data);
  }

  // --- Audit Logs ---
  getAuditLogs(userId = DEFAULT_USER_ID): AuditLog[] {
    this.ensureUserData(userId);
    return this.data.auditLogs.filter(l => l.userId === userId);
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const fullLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(fullLog);
    if (this.data.auditLogs.length > 800) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 800);
    }
    this.saveData(this.data);
    return fullLog;
  }

  // --- Review Queue ---
  getReviewQueue(userId = DEFAULT_USER_ID): ReviewQueueItem[] {
    this.ensureUserData(userId);
    return this.data.reviewQueue.filter(r => r.userId === userId);
  }

  getReviewQueueItem(id: string): ReviewQueueItem | undefined {
    return this.data.reviewQueue.find(r => r.id === id);
  }

  saveReviewQueueItem(item: ReviewQueueItem): void {
    const idx = this.data.reviewQueue.findIndex(r => r.id === item.id);
    if (idx >= 0) {
      this.data.reviewQueue[idx] = item;
    } else {
      this.data.reviewQueue.unshift(item);
    }
    this.saveData(this.data);
  }

  // --- Transactions & Emails & Connections ---
  getTransactions(userId = DEFAULT_USER_ID): Transaction[] {
    this.ensureUserData(userId);
    return this.data.transactions.filter(t => t.userId === userId);
  }

  addTransaction(txn: Transaction): void {
    this.data.transactions.unshift(txn);
    this.saveData(this.data);
  }

  getEmails(userId = DEFAULT_USER_ID): SimulatedEmail[] {
    this.ensureUserData(userId);
    return this.data.emails;
  }

  getConnections(): ConnectionStatus[] {
    return this.data.connections;
  }

  updateConnection(id: string, partial: Partial<ConnectionStatus>): void {
    const conn = this.data.connections.find(c => c.id === id);
    if (conn) {
      Object.assign(conn, partial);
      this.saveData(this.data);
    }
  }

  setLastScanTime(timeStr: string) {
    this.data.lastScanTime = timeStr;
    this.saveData(this.data);
  }

  getLastScanTime(): string | undefined {
    return this.data.lastScanTime;
  }

  resetToSeed(): void {
    const seed = this.generateInitialStore();
    this.saveData(seed);
  }

  // --- Aggregate Stats ---
  getStats(userId = DEFAULT_USER_ID): GuardianStats {
    this.ensureUserData(userId);
    const subs = this.getSubscriptions(userId);
    const actions = this.getActions(userId);
    const review = this.getReviewQueue(userId);
    const guardrails = this.getGuardrails(userId);

    const activeSubs = subs.filter(s => s.status === 'active');

    const recurringSpendMonthly = activeSubs.reduce((acc, s) => acc + s.amount, 0);
    const recurringSpendAnnual = recurringSpendMonthly * 12;

    // Potential savings: sum of active subs with wasteScore > 60 and non-protected
    const potentialMonthlySavings = activeSubs
      .filter(s => s.wasteScore >= 60 && !guardrails.protectedCategories.includes(s.category.toLowerCase()))
      .reduce((acc, s) => acc + s.amount, 0);
    const potentialAnnualSavings = potentialMonthlySavings * 12;

    // Confirmed savings: verified cancelled actions or cancelled subs
    const confirmedMonthlySavings = actions
      .filter(a => (a.actionType === 'AUTO_CANCEL' || a.actionType === 'USER_APPROVED_CANCEL' || a.actionType === 'AUTO_DOWNGRADE') && (a.executionStatus === 'verified' || a.executionStatus === 'completed'))
      .reduce((acc, a) => acc + a.amount, 0);
    const confirmedAnnualSavings = confirmedMonthlySavings * 12;

    const unusedSubscriptions = activeSubs.filter(s => s.daysSinceLastUsed > 60).length;
    const duplicates = activeSubs.filter(s => s.duplicateGroup || (s.overlappingWith && s.overlappingWith.length > 0)).length;
    const priceIncreases = activeSubs.filter(s => s.isPriceIncrease).length;
    const pendingApprovals = review.filter(r => r.status === 'pending').length;
    const completedActions = actions.filter(a => a.executionStatus === 'verified' || a.executionStatus === 'completed').length;

    return {
      recurringSpendMonthly: Math.round(recurringSpendMonthly * 100) / 100,
      recurringSpendAnnual: Math.round(recurringSpendAnnual * 100) / 100,
      potentialSavingsMonthly: Math.round(potentialMonthlySavings * 100) / 100,
      potentialSavingsAnnual: Math.round(potentialAnnualSavings * 100) / 100,
      confirmedSavingsMonthly: Math.round(confirmedMonthlySavings * 100) / 100,
      confirmedSavingsAnnual: Math.round(confirmedAnnualSavings * 100) / 100,
      subscriptionsDetected: subs.length,
      unusedSubscriptions,
      duplicates,
      priceIncreases,
      pendingApprovals,
      completedActions,
      automationPaused: guardrails.pauseAutomation,
      lastScanTime: this.data.lastScanTime,
    };
  }

  // --- Bank Statement CSV & Payment App Ingestion ---
  importBankStatementCsv(
    userId: string,
    records: Array<{
      date: string;
      description: string;
      amount: number;
      category?: string;
      merchant?: string;
      referenceNo?: string;
    }>,
    bankName = 'HDFC Bank Statement'
  ): {
    importedTransactions: number;
    newSubscriptions: number;
    totalSubscriptions: number;
  } {
    this.ensureUserData(userId);
    let importedTransactions = 0;
    let newSubscriptions = 0;

    // Helper for intelligent merchant, category, and usage extraction
    const extractMerchantDetails = (rawDesc: string, userCategory?: string, userMerchant?: string) => {
      const desc = rawDesc.trim();
      const descLower = desc.toLowerCase();

      // Check explicit known brands
      if (descLower.includes('netflix') || descLower.includes('streamflix')) {
        return { name: 'Netflix India', category: 'Entertainment', daysUnused: 180, isRecurring: true };
      }
      if (descLower.includes('spotify') || descLower.includes('tunewave')) {
        return { name: 'Spotify India', category: 'Music', daysUnused: 2, isRecurring: true };
      }
      if (descLower.includes('hotstar') || descLower.includes('disney')) {
        return { name: 'Disney+ Hotstar', category: 'Entertainment', daysUnused: 45, isRecurring: true };
      }
      if (descLower.includes('prime') || descLower.includes('amazon pay') || descLower.includes('prime video')) {
        return { name: 'Amazon Prime Video', category: 'Entertainment', daysUnused: 10, isRecurring: true };
      }
      if (descLower.includes('youtube') || descLower.includes('yt premium')) {
        return { name: 'YouTube Premium', category: 'Entertainment', daysUnused: 3, isRecurring: true };
      }
      if (descLower.includes('swiggy') || descLower.includes('swiggy one')) {
        return { name: 'Swiggy One Membership', category: 'Food & Delivery', daysUnused: 65, isRecurring: true };
      }
      if (descLower.includes('zomato') || descLower.includes('zomato gold')) {
        return { name: 'Zomato Gold', category: 'Food & Delivery', daysUnused: 14, isRecurring: true };
      }
      if (descLower.includes('cult') || descLower.includes('cultfit') || descLower.includes('curefit') || descLower.includes('gym')) {
        return { name: 'Cult.fit Cultpass', category: 'Fitness & Health', daysUnused: 72, isRecurring: true };
      }
      if (descLower.includes('chatgpt') || descLower.includes('openai')) {
        return { name: 'OpenAI ChatGPT Plus', category: 'Productivity & AI', daysUnused: 1, isRecurring: true };
      }
      if (descLower.includes('claude') || descLower.includes('anthropic')) {
        return { name: 'Anthropic Claude Pro', category: 'Productivity & AI', daysUnused: 2, isRecurring: true };
      }
      if (descLower.includes('midjourney')) {
        return { name: 'Midjourney AI', category: 'Productivity & AI', daysUnused: 28, isRecurring: true };
      }
      if (descLower.includes('apple') || descLower.includes('icloud')) {
        return { name: 'Apple iCloud+ Storage', category: 'Cloud Storage', daysUnused: 12, isRecurring: true };
      }
      if (descLower.includes('google one') || descLower.includes('drive storage')) {
        return { name: 'Google One Storage', category: 'Cloud Storage', daysUnused: 4, isRecurring: true };
      }
      if (descLower.includes('dropbox')) {
        return { name: 'Dropbox Plus', category: 'Cloud Storage', daysUnused: 50, isRecurring: true };
      }
      if (descLower.includes('adobe') || descLower.includes('creative cloud') || descLower.includes('photoshop')) {
        return { name: 'Adobe Creative Cloud', category: 'Software', daysUnused: 8, isRecurring: true };
      }
      if (descLower.includes('microsoft') || descLower.includes('office 365') || descLower.includes('msft')) {
        return { name: 'Microsoft 365', category: 'Productivity', daysUnused: 6, isRecurring: true };
      }
      if (descLower.includes('notion')) {
        return { name: 'Notion Plus', category: 'Productivity', daysUnused: 5, isRecurring: true };
      }
      if (descLower.includes('github') || descLower.includes('copilot')) {
        return { name: 'GitHub Pro / Copilot', category: 'Software', daysUnused: 1, isRecurring: true };
      }
      if (descLower.includes('canva')) {
        return { name: 'Canva Pro', category: 'Productivity', daysUnused: 15, isRecurring: true };
      }
      if (descLower.includes('chess')) {
        return { name: 'Chess.com Diamond', category: 'Gaming & Strategy', daysUnused: 0, isRecurring: true };
      }
      if (descLower.includes('playstation') || descLower.includes('ps plus') || descLower.includes('sony interactive')) {
        return { name: 'PlayStation Plus', category: 'Gaming', daysUnused: 20, isRecurring: true };
      }
      if (descLower.includes('xbox') || descLower.includes('game pass')) {
        return { name: 'Xbox Game Pass', category: 'Gaming', daysUnused: 35, isRecurring: true };
      }
      if (descLower.includes('insurance') || descLower.includes('hdfc life') || descLower.includes('care health') || descLower.includes('star health') || descLower.includes('max life') || descLower.includes('lic') || descLower.includes('policybazaar')) {
        return { name: userMerchant || 'Care Health Insurance', category: 'Insurance', daysUnused: 15, isRecurring: true };
      }
      if (descLower.includes('jio') || descLower.includes('jiofiber') || descLower.includes('airtel') || descLower.includes('broadband')) {
        return { name: userMerchant || 'Broadband Internet', category: 'Utility & Media', daysUnused: 2, isRecurring: true };
      }
      if (descLower.includes('phonepe') || descLower.includes('gpay') || descLower.includes('paytm') || descLower.includes('autopay') || descLower.includes('mandate')) {
        return { name: userMerchant || 'AutoPay Mandate Subscription', category: 'Utility & Media', daysUnused: 8, isRecurring: true };
      }

      // If provided in CSV explicitly
      if (userMerchant && userMerchant.trim().length > 1) {
        return {
          name: userMerchant.trim(),
          category: userCategory || 'Software & Subscriptions',
          daysUnused: 14,
          isRecurring: true,
        };
      }

      // Clean generic merchant from narration
      let cleaned = desc
        .replace(/^(UPI-AUTOPAY-|AUTOPAY-|SI-|NACH-|POS |MANDATE |E-MANDATE-|DIRECT DEBIT-|BILLDESK-|PAYU-|RAZORPAY-|CC-|DC-|INB-|UPI\/|UPI-)/i, '')
        .replace(/(-MUMBAI|-BANGALORE|-DELHI|-PUNE|-CHENNAI|-HYDERABAD|PVT LTD|PRIVATE LIMITED|LTD|INDIA|CORP|INC|LLC|SERVICES|PAYMENT|PAYMENTS|RECURRING|SUBSCRIPTION|MEMBERSHIP|ONLINE|GATEWAY)/gi, '')
        .replace(/[0-9_#\-\/]/g, ' ')
        .trim();

      if (cleaned.length < 3) {
        cleaned = desc.slice(0, 24);
      }

      // Title Case
      const formatted = cleaned
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      // Infer category from user input or fallback
      let category = userCategory || 'Software';
      if (descLower.includes('fit') || descLower.includes('health') || descLower.includes('yoga') || descLower.includes('wellness')) {
        category = 'Fitness & Health';
      } else if (descLower.includes('stream') || descLower.includes('tv') || descLower.includes('movie') || descLower.includes('video')) {
        category = 'Entertainment';
      } else if (descLower.includes('music') || descLower.includes('audio') || descLower.includes('sound') || descLower.includes('fm')) {
        category = 'Music';
      } else if (descLower.includes('ai') || descLower.includes('gpt') || descLower.includes('tool') || descLower.includes('cloud')) {
        category = 'Productivity & AI';
      } else if (descLower.includes('insur') || descLower.includes('policy') || descLower.includes('premium')) {
        category = 'Insurance';
      }

      return {
        name: formatted,
        category,
        daysUnused: 21,
        isRecurring: true,
      };
    };

    for (const rec of records) {
      const extracted = extractMerchantDetails(rec.description || '', rec.category, rec.merchant);
      const merchantName = extracted.name;
      const category = extracted.category;
      const isRecurring = extracted.isRecurring;
      const daysUnused = extracted.daysUnused;

      const txnId = `txn_csv_${Date.now()}_${importedTransactions}_${crypto.randomBytes(2).toString('hex')}`;
      const newTxn: Transaction = {
        id: txnId,
        userId,
        date: rec.date || new Date().toISOString().split('T')[0],
        amount: Math.abs(rec.amount),
        currency: 'INR',
        merchant: merchantName,
        category,
        description: rec.description,
        rawDescription: `${bankName} CSV: ${rec.description}`,
        accountName: bankName,
        isRecurring,
        pending: false,
        simulated: false,
      };

      this.data.transactions.unshift(newTxn);
      importedTransactions++;

      // If recurring subscription detected, check if already in subscriptions or add new
      if (isRecurring) {
        const subId = `sub_${userId}_${merchantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const existing = this.data.subscriptions.find(
          s => s.userId === userId && (s.id === subId || s.name.toLowerCase() === merchantName.toLowerCase() || s.merchant.toLowerCase() === merchantName.toLowerCase())
        );

        if (existing) {
          // If price increase detected in newer statement
          const currentAmount = Math.abs(rec.amount);
          if (currentAmount > existing.amount && existing.amount > 0) {
            existing.previousAmount = existing.amount;
            existing.amount = currentAmount;
            existing.isPriceIncrease = true;
            existing.updatedAt = new Date().toISOString();
            existing.priceHistory.push({
              date: rec.date || new Date().toISOString().split('T')[0],
              amount: currentAmount,
            });

            // Add item to review queue for price increase
            const reviewId = `rev_price_inc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const priceIncreaseItem: ReviewQueueItem = {
              id: reviewId,
              userId,
              subscriptionId: existing.id,
              subscriptionName: existing.name,
              amount: currentAmount,
              category: existing.category,
              reason: `Price increase detected in ${bankName} statement (+ ₹${(currentAmount - (existing.previousAmount || 0)).toFixed(2)}/mo).`,
              options: [
                { action: 'CANCEL_THIS', label: `Cancel ${existing.name}` },
                { action: 'KEEP_BOTH', label: 'Accept New Pricing & Keep' },
                { action: 'DISMISS', label: 'Dismiss Notice' },
              ],
              status: 'pending',
              createdAt: new Date().toISOString(),
            };
            this.saveReviewQueueItem(priceIncreaseItem);
          } else {
            existing.lastChargeDate = rec.date || new Date().toISOString().split('T')[0];
            existing.updatedAt = new Date().toISOString();
          }
        } else {
          const isIns = category.toLowerCase().includes('insurance');
          const waste = daysUnused > 60 ? 88 : daysUnused > 30 ? 60 : isIns ? 5 : 15;

          const newSub: Subscription = {
            id: subId,
            userId,
            name: merchantName,
            merchant: merchantName,
            category,
            amount: Math.abs(rec.amount),
            currency: 'INR',
            billingCycle: 'monthly',
            status: 'active',
            firstSeenDate: rec.date || new Date().toISOString().split('T')[0],
            lastChargeDate: rec.date || new Date().toISOString().split('T')[0],
            nextChargeDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
            daysSinceLastUsed: daysUnused,
            usageLevel: daysUnused > 60 ? 'unused' : daysUnused > 20 ? 'low' : 'high',
            priceHistory: [{ date: rec.date || new Date().toISOString().split('T')[0], amount: Math.abs(rec.amount) }],
            isTrialConversion: false,
            isPriceIncrease: false,
            wasteScore: waste,
            confidenceScore: 95,
            riskLevel: isIns ? 'HIGH' : waste >= 70 ? 'LOW' : 'MEDIUM',
            analysisReasoning: isIns
              ? 'Protected insurance policy. Guardrail invariants prevent automated cancellation.'
              : daysUnused > 60
              ? `Unused for ${daysUnused} days detected from ${bankName} statement. High waste candidate.`
              : `Active subscription verified from ${bankName} statement.`,
            evidence: [
              `Verified via ${bankName} statement upload`,
              `Last debited ₹${Math.abs(rec.amount).toFixed(2)} on ${rec.date || 'recent cycle'}`,
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          this.data.subscriptions.push(newSub);
          newSubscriptions++;
        }
      }
    }

    // Run smart duplicate & category overlap detection across all active subscriptions
    const userActiveSubs = this.data.subscriptions.filter(s => s.userId === userId && s.status === 'active');
    const categoryBuckets: Record<string, Subscription[]> = {};

    userActiveSubs.forEach(s => {
      const catKey = s.category.toLowerCase();
      if (!categoryBuckets[catKey]) categoryBuckets[catKey] = [];
      categoryBuckets[catKey].push(s);
    });

    Object.entries(categoryBuckets).forEach(([cat, subsInCat]) => {
      // If user pays for 2+ services in streaming/music/cloud storage, flag as duplicate catalog
      if (subsInCat.length > 1 && (cat.includes('entertain') || cat.includes('music') || cat.includes('cloud') || cat.includes('food') || cat.includes('ai'))) {
        subsInCat.forEach(sub => {
          const others = subsInCat.filter(o => o.id !== sub.id);
          sub.overlappingWith = others.map(o => o.name);
          sub.duplicateGroup = `group_${cat.replace(/[^a-z0-9]/g, '_')}`;

          // Check if a review item already exists for this pair
          const existingReview = this.data.reviewQueue.find(
            r => r.userId === userId && r.status === 'pending' && (r.subscriptionId === sub.id || r.subscriptionName === sub.name)
          );

          if (!existingReview) {
            const partner = others[0];
            const revId = `rev_dup_${sub.id}_${partner.id}`;
            const dupReviewItem: ReviewQueueItem = {
              id: revId,
              userId,
              subscriptionId: sub.id,
              subscriptionName: sub.name,
              amount: sub.amount,
              category: sub.category,
              overlappingSubscription: {
                id: partner.id,
                name: partner.name,
                amount: partner.amount,
                currency: partner.currency || 'INR',
                daysSinceLastUsed: partner.daysSinceLastUsed,
              },
              reason: 'DUPLICATE_SERVICES',
              options: [
                { action: 'CANCEL_THIS', label: `Cancel ${sub.name} (₹${sub.amount.toFixed(2)})` },
                { action: 'CANCEL_OTHER', label: `Cancel ${partner.name} (₹${partner.amount.toFixed(2)})` },
                { action: 'KEEP_BOTH', label: 'Keep Both Services' },
              ],
              status: 'pending',
              createdAt: new Date().toISOString(),
            };
            this.saveReviewQueueItem(dupReviewItem);
          }
        });
      }
    });

    // Update CSV connection status
    this.updateConnection('conn_csv_statement', {
      status: 'connected',
      lastSyncTime: new Date().toISOString(),
      itemCount: (this.data.connections.find(c => c.id === 'conn_csv_statement')?.itemCount || 0) + importedTransactions,
    });

    this.addAuditLog({
      userId,
      eventType: 'GUARDRAILS_UPDATED',
      entityId: 'conn_csv_statement',
      entityType: 'connection',
      description: `Imported ${importedTransactions} transactions from ${bankName} CSV. Detected ${newSubscriptions} new recurring subscriptions.`,
      severity: 'success',
      metadata: { importedTransactions, newSubscriptions, bankName },
    });

    this.saveData(this.data);

    return {
      importedTransactions,
      newSubscriptions,
      totalSubscriptions: this.getSubscriptions(userId).length,
    };
  }

  togglePaymentAppPermission(
    userId: string,
    appId: string,
    enabled: boolean,
    permissions: string[]
  ): ConnectionStatus | null {
    const connId = `conn_${appId}`;
    const conn = this.data.connections.find(c => c.id === connId || c.appId === appId);
    if (!conn) return null;

    conn.status = enabled ? 'connected' : 'disconnected';
    conn.permissions = permissions;
    conn.lastSyncTime = new Date().toISOString();

    this.addAuditLog({
      userId,
      eventType: 'GUARDRAILS_UPDATED',
      entityId: conn.id,
      entityType: 'payment_app',
      description: `Payment App permissions updated for ${conn.name}. Status: ${conn.status}. Permissions: ${permissions.join(', ')}.`,
      severity: 'info',
      metadata: { appId, enabled, permissions },
    });

    this.saveData(this.data);
    return conn;
  }
}

export const store = new Store();
