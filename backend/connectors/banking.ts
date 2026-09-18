import { Transaction } from '../models/types.js';
import { store } from '../db/store.js';

export interface BankingConnector {
  getProviderName(): string;
  fetchRecentTransactions(userId: string): Promise<Transaction[]>;
  isLiveConnection(): boolean;
}

export class SimulatedBankingConnector implements BankingConnector {
  getProviderName(): string {
    return 'Simulated Plaid/OpenBanking Feed';
  }

  isLiveConnection(): boolean {
    return false;
  }

  async fetchRecentTransactions(userId: string): Promise<Transaction[]> {
    // In production, this would call Plaid / Teller API with access token
    return store.getTransactions(userId);
  }
}

export const defaultBankingConnector = new SimulatedBankingConnector();
