import { ActionVerification } from '../models/types.js';
import crypto from 'crypto';

export interface MerchantConnector {
  cancelSubscription(merchantName: string, subscriptionId: string): Promise<ActionVerification>;
  downgradeSubscription(merchantName: string, subscriptionId: string, targetTier: string): Promise<ActionVerification>;
  verifyStatus(merchantName: string, confirmationCode: string): Promise<boolean>;
}

export class SimulatedMerchantConnector implements MerchantConnector {
  async cancelSubscription(merchantName: string, subscriptionId: string): Promise<ActionVerification> {
    // Simulate real network latency (50-150ms)
    await new Promise(r => setTimeout(r, 60));

    const code = `CNX-${merchantName.substring(0, 4).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    return {
      verified: true,
      verifiedAt: new Date().toISOString(),
      merchantConfirmationCode: code,
      merchantResponse: `Simulated Merchant API: Cancellation acknowledged by ${merchantName}. Service termination scheduled at end of billing cycle. Confirmation ID: ${code}`,
      verificationMethod: 'direct_api',
    };
  }

  async downgradeSubscription(merchantName: string, subscriptionId: string, targetTier: string): Promise<ActionVerification> {
    await new Promise(r => setTimeout(r, 60));

    const code = `DWN-${merchantName.substring(0, 4).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    return {
      verified: true,
      verifiedAt: new Date().toISOString(),
      merchantConfirmationCode: code,
      merchantResponse: `Simulated Merchant API: Downgraded to ${targetTier} plan. Effective on next invoice. Confirmation ID: ${code}`,
      verificationMethod: 'direct_api',
    };
  }

  async verifyStatus(_merchantName: string, _confirmationCode: string): Promise<boolean> {
    return true;
  }
}

export const defaultMerchantConnector = new SimulatedMerchantConnector();
