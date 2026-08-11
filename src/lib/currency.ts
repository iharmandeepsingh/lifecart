export type Currency = 'EUR' | 'INR' | 'USD';

export interface Money {
  amount: number;
  currency: Currency;
}

export function formatMoney(amount: number, currency: Currency = 'EUR'): string {
  const localeMap: Record<Currency, string> = {
    EUR: 'de-DE',
    INR: 'en-IN',
    USD: 'en-US',
  };

  const currencySymbolMap: Record<Currency, string> = {
    EUR: '€',
    INR: '₹',
    USD: '$',
  };

  try {
    return new Intl.NumberFormat(localeMap[currency] || 'de-DE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (err) {
    return `${currencySymbolMap[currency] || '€'}${amount.toFixed(2)}`;
  }
}

export function ensureSameCurrency(a: Money, b: Money): boolean {
  return a.currency === b.currency;
}
