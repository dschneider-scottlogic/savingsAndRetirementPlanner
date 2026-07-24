import { SUPPORTED_CURRENCIES } from './currencies.js';

// Frankfurter (frankfurter.dev) mirrors ECB reference rates, needs no API
// key, and has permissive CORS - it can be called straight from the browser,
// which is the only option for the GitHub Pages demo build (no backend).
const FX_BASE_CURRENCY = 'EUR';
const FX_API_URL = 'https://api.frankfurter.dev/v1/latest';

export async function fetchLiveRates() {
  const symbols = SUPPORTED_CURRENCIES.filter((c) => c !== FX_BASE_CURRENCY).join(',');
  const res = await fetch(`${FX_API_URL}?base=${FX_BASE_CURRENCY}&symbols=${symbols}`);
  if (!res.ok) throw new Error(`Exchange rate service returned ${res.status}`);
  const data = await res.json();
  return {
    base: FX_BASE_CURRENCY,
    rates: { [FX_BASE_CURRENCY]: 1, ...data.rates },
    updatedAt: new Date().toISOString(),
  };
}
