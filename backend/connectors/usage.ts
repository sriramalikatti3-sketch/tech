import { UsageRecord } from '../models/types.js';

export interface UsageConnector {
  getUsageMetrics(subscriptionId: string): Promise<UsageRecord | null>;
}

export class SimulatedUsageConnector implements UsageConnector {
  async getUsageMetrics(subscriptionId: string): Promise<UsageRecord | null> {
    const usageDatabase: Record<string, UsageRecord> = {
      sub_streamflix: {
        subscriptionId: 'sub_streamflix',
        lastLoginDate: new Date(Date.now() - 187 * 24 * 60 * 60 * 1000).toISOString(),
        daysSinceLastUsed: 187,
        monthlyLogins: 0,
        activeFeaturesUsed: 0,
      },
      sub_tunewave: {
        subscriptionId: 'sub_tunewave',
        lastLoginDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        daysSinceLastUsed: 4,
        monthlyLogins: 28,
        activeFeaturesUsed: 5,
      },
      sub_musicbox: {
        subscriptionId: 'sub_musicbox',
        lastLoginDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        daysSinceLastUsed: 40,
        monthlyLogins: 1,
        activeFeaturesUsed: 1,
      },
      sub_healthguard: {
        subscriptionId: 'sub_healthguard',
        lastLoginDate: new Date(Date.now() - 310 * 24 * 60 * 60 * 1000).toISOString(),
        daysSinceLastUsed: 310,
        monthlyLogins: 0,
        activeFeaturesUsed: 0,
      },
      sub_cloudsync: {
        subscriptionId: 'sub_cloudsync',
        lastLoginDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        daysSinceLastUsed: 12,
        monthlyLogins: 14,
        activeFeaturesUsed: 3,
      },
      sub_ai_writer: {
        subscriptionId: 'sub_ai_writer',
        lastLoginDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        daysSinceLastUsed: 25,
        monthlyLogins: 1,
        activeFeaturesUsed: 1,
      },
      sub_fitlife: {
        subscriptionId: 'sub_fitlife',
        lastLoginDate: new Date(Date.now() - 98 * 24 * 60 * 60 * 1000).toISOString(),
        daysSinceLastUsed: 98,
        monthlyLogins: 0,
        activeFeaturesUsed: 0,
      },
    };

    return usageDatabase[subscriptionId] || null;
  }
}

export const defaultUsageConnector = new SimulatedUsageConnector();
