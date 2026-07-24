import { useMemo } from 'react';
import { computeSavingsGoal, toCurrency } from '../calculations.js';
import { formatCurrency, formatPercent } from '../format.js';
import Section from './Section.jsx';
import ProgressBar from './ProgressBar.jsx';
import ToggleField from './fields/ToggleField.jsx';

function newAccount() {
  return { id: `account-${Date.now()}`, name: 'New account', balance: 0, currency: 'EUR' };
}

export default function SavingsGoal({ config, onChange }) {
  const includedPotIds = config.savingsGoal.includedPotIds ?? [];

  const extraMonthlyContributions = useMemo(
    () =>
      config.retirementPots
        .filter((pot) => includedPotIds.includes(pot.id))
        .reduce(
          (sum, pot) =>
            sum + toCurrency(pot.monthlyContribution, pot.currency ?? 'EUR', config.savingsGoal.currency, config.fx),
          0
        ),
    [config.retirementPots, includedPotIds, config.savingsGoal.currency, config.fx]
  );

  const goalOnly = useMemo(() => computeSavingsGoal(config, new Date(), 0), [config]);
  const combined = useMemo(
    () => computeSavingsGoal(config, new Date(), extraMonthlyContributions),
    [config, extraMonthlyContributions]
  );
  const result = goalOnly;

  function updateGoal(patch) {
    onChange({ ...config, savingsGoal: { ...config.savingsGoal, ...patch } });
  }

  function updateAccount(id, patch) {
    onChange({
      ...config,
      savingsAccounts: config.savingsAccounts.map((acc) => (acc.id === id ? { ...acc, ...patch } : acc)),
    });
  }

  function removeAccount(id) {
    const account = config.savingsAccounts.find((a) => a.id === id);
    if (!window.confirm(`Remove "${account?.name ?? 'this account'}"? This can't be undone.`)) return;
    onChange({ ...config, savingsAccounts: config.savingsAccounts.filter((a) => a.id !== id) });
  }

  function addAccount() {
    onChange({ ...config, savingsAccounts: [...config.savingsAccounts, newAccount()] });
  }

  function togglePotIncluded(id) {
    const next = includedPotIds.includes(id)
      ? includedPotIds.filter((p) => p !== id)
      : [...includedPotIds, id];
    onChange({ ...config, savingsGoal: { ...config.savingsGoal, includedPotIds: next } });
  }

  return (
    <div>
      <Section title="Target">
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Target amount</span>
            <input
              type="number"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              value={config.savingsGoal.targetAmount}
              onChange={(e) => updateGoal({ targetAmount: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Target date</span>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              value={config.savingsGoal.targetDate}
              onChange={(e) => updateGoal({ targetDate: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Currency</span>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              value={config.savingsGoal.currency}
              onChange={(e) => updateGoal({ currency: e.target.value })}
            >
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
        </div>
      </Section>

      <Section
        title="Accounts"
        actions={
          <button onClick={addAccount} className="text-sm text-indigo-600 hover:underline">
            + Add account
          </button>
        }
      >
        <div className="space-y-2">
          {config.savingsAccounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-2">
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                value={acc.name}
                onChange={(e) => updateAccount(acc.id, { name: e.target.value })}
              />
              <input
                type="number"
                className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
                value={acc.balance}
                onChange={(e) => updateAccount(acc.id, { balance: Number(e.target.value) })}
              />
              <select
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                value={acc.currency}
                onChange={(e) => updateAccount(acc.id, { currency: e.target.value })}
              >
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              <button onClick={() => removeAccount(acc.id)} className="text-gray-400 hover:text-red-600">
                ✕
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Progress & required savings rate">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-semibold text-gray-900">
            {formatCurrency(result.totalSaved, result.currency)}
          </span>
          <span className="text-sm text-gray-500">
            of {formatCurrency(config.savingsGoal.targetAmount, result.currency)}
          </span>
        </div>
        <ProgressBar percent={result.percentComplete} />
        <div className="text-sm text-gray-600 mt-2">{formatPercent(result.percentComplete)} complete</div>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div className="rounded-md bg-gray-50 p-4">
            <div className="text-xs uppercase text-gray-500 mb-1">Shortfall</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(result.shortfall, result.currency)}
            </div>
          </div>

          <div className="rounded-md bg-gray-50 p-4">
            <div className="text-xs uppercase text-gray-500 mb-1">Required per month</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(goalOnly.requiredPerMonthEUR, 'EUR')} / {formatCurrency(goalOnly.requiredPerMonthGBP, 'GBP')}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">for this goal alone</div>

            {config.retirementPots.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">
                  + also count existing pot contributions (already committed elsewhere, so they add
                  to your total):
                </div>
                <div className="space-y-1">
                  {config.retirementPots.map((pot) => (
                    <ToggleField
                      key={pot.id}
                      label={`${pot.name} (${formatCurrency(pot.monthlyContribution, pot.currency ?? 'EUR')}/mo)`}
                      checked={includedPotIds.includes(pot.id)}
                      onChange={() => togglePotIncluded(pot.id)}
                    />
                  ))}
                </div>

                {extraMonthlyContributions > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-300">
                    <div className="text-xs uppercase text-indigo-500 mb-1">
                      = Total monthly commitment
                    </div>
                    <div className="text-lg font-semibold text-indigo-900">
                      {formatCurrency(combined.requiredPerMonthEUR, 'EUR')} /{' '}
                      {formatCurrency(combined.requiredPerMonthGBP, 'GBP')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
