/**
 * Indian Rupee (INR) formatting utilities for Secure Money.
 */

export function formatINR(
  amount: number | null | undefined,
  options?: {
    showDecimals?: boolean;
    compact?: boolean;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const absAmount = Math.abs(amount);

  // Lakhs / Crores for compact display on large totals
  if (options?.compact) {
    if (absAmount >= 10000000) {
      return `${amount < 0 ? '-' : ''}₹${(absAmount / 10000000).toFixed(1)} Cr`;
    }
    if (absAmount >= 100000) {
      return `${amount < 0 ? '-' : ''}₹${(absAmount / 100000).toFixed(1)}L`;
    }
    if (absAmount >= 1000) {
      return `${amount < 0 ? '-' : ''}₹${(absAmount / 1000).toFixed(1)}k`;
    }
  }

  const hasDecimals = !Number.isInteger(amount) && options?.showDecimals !== false;
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return `₹${formatted}`;
}

export const RUPEE_SYMBOL = '₹';
