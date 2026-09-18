import { SimulatedEmail } from '../models/types.js';
import { store } from '../db/store.js';

export interface EmailConnector {
  getProviderName(): string;
  fetchSubscriptionSignals(userId: string): Promise<SimulatedEmail[]>;
}

export class SimulatedEmailConnector implements EmailConnector {
  getProviderName(): string {
    return 'Simulated Google Workspace / Gmail Feed';
  }

  async fetchSubscriptionSignals(_userId: string): Promise<SimulatedEmail[]> {
    return store.getEmails();
  }
}

export const defaultEmailConnector = new SimulatedEmailConnector();
