import { useState } from 'react';
import Section from './Section.jsx';
import NumberField from './fields/NumberField.jsx';
import { fetchLiveRates } from '../fx.js';
import { SUPPORTED_CURRENCIES } from '../currencies.js';

export default function Settings({ config, onChange }) {
  const [refreshState, setRefreshState] = useState('idle'); // idle | refreshing | error

  function updatePersonal(patch) {
    onChange({ ...config, personal: { ...config.personal, ...patch } });
  }

  function updateRate(currency, rate) {
    onChange({ ...config, fx: { ...config.fx, rates: { ...config.fx.rates, [currency]: rate } } });
  }

  async function refreshRates() {
    setRefreshState('refreshing');
    try {
      const live = await fetchLiveRates();
      onChange({ ...config, fx: { ...config.fx, ...live, rates: { ...config.fx.rates, ...live.rates } } });
      setRefreshState('idle');
    } catch {
      setRefreshState('error');
    }
  }

  return (
    <div>
      <Section title="Personal">
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField
            label="Current age"
            value={config.personal.currentAge}
            step="1"
            onChange={(v) => updatePersonal({ currentAge: v })}
          />
          <NumberField
            label="Target retirement age"
            value={config.personal.targetRetirementAge}
            step="1"
            onChange={(v) => updatePersonal({ targetRetirementAge: v })}
          />
        </div>
      </Section>

      <Section
        title="Exchange rates"
        actions={
          <button onClick={refreshRates} disabled={refreshState === 'refreshing'} className="text-sm text-indigo-600 hover:underline disabled:opacity-50">
            {refreshState === 'refreshing' ? 'Refreshing…' : 'Refresh from live rates'}
          </button>
        }
      >
        <p className="text-xs text-gray-400 mb-3">
          Units of each currency per 1 EUR. {config.fx.updatedAt
            ? `Last refreshed ${new Date(config.fx.updatedAt).toLocaleString()}.`
            : 'Never refreshed from a live source yet.'}{' '}
          {refreshState === 'error' && <span className="text-red-500">Refresh failed - keeping existing rates.</span>}
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {SUPPORTED_CURRENCIES.filter((c) => c !== config.fx.base).map((currency) => (
            <NumberField
              key={currency}
              label={`EUR → ${currency}`}
              value={config.fx.rates[currency] ?? ''}
              step="0.01"
              onChange={(v) => updateRate(currency, v)}
            />
          ))}
        </div>
      </Section>

      <p className="text-xs text-gray-400">
        Retirement pot and savings account definitions are edited on their own pages so live
        recalculation is visible immediately.
      </p>
    </div>
  );
}
