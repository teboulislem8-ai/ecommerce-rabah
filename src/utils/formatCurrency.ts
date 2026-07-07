export function formatCurrency(amount: number, currency = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency,
  }).format(amount);
}
