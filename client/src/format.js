export function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value, digits = 0) {
  return `${value.toFixed(digits)}%`;
}
