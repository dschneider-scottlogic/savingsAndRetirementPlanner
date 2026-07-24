import { useMemo, useState } from 'react';
import { computePots, computeSavingsGoal } from '../calculations.js';
import { formatCurrency, formatPercent } from '../format.js';
import Section from './Section.jsx';
import ProgressBar from './ProgressBar.jsx';
import NumberField from './fields/NumberField.jsx';

export default function Dashboard({ config, onChange, onNavigate }) {
  const pots = useMemo(() => computePots(config), [config]);
  const savingsGoal = useMemo(() => computeSavingsGoal(config), [config]);
  const [showBalanceForm, setShowBalanceForm] = useState(false);

  const years = Math.floor(pots.monthsRemaining / 12);
  const months = pots.monthsRemaining % 12;

  function updateAccountBalance(id, balance) {
    onChange({
      ...config,
      savingsAccounts: config.savingsAccounts.map((acc) => (acc.id === id ? { ...acc, balance } : acc)),
    });
  }

  function updatePotBalance(id, startBalance) {
    onChange({
      ...config,
      retirementPots: config.retirementPots.map((pot) => (pot.id === id ? { ...pot, startBalance } : pot)),
    });
  }

  return (
    <div>
      <Section title="Savings goal progress">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-semibold text-gray-900">
            {formatCurrency(savingsGoal.totalSaved, savingsGoal.currency)}
          </span>
          <span className="text-sm text-gray-500">
            of {formatCurrency(config.savingsGoal.targetAmount, savingsGoal.currency)} by{' '}
            {config.savingsGoal.targetDate}
          </span>
        </div>
        <ProgressBar percent={savingsGoal.percentComplete} />
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <span>{formatPercent(savingsGoal.percentComplete)} complete</span>
          <button className="text-indigo-600 hover:underline" onClick={() => onNavigate('Savings Goal')}>
            View details →
          </button>
        </div>
      </Section>

      <Section title="Projected retirement pot">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="rounded-md bg-gray-50 p-4">
            <div className="text-xs uppercase text-gray-500 mb-1">Full contribution scenario</div>
            <div className="text-xl font-semibold text-gray-900">{formatCurrency(pots.totalFull, 'EUR')}</div>
          </div>
          <div className="rounded-md bg-gray-50 p-4">
            <div className="text-xs uppercase text-gray-500 mb-1">Contributions-stop-early scenario</div>
            <div className="text-xl font-semibold text-gray-900">{formatCurrency(pots.totalLimited, 'EUR')}</div>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {years} years {months} months until age {config.personal.targetRetirementAge}
        </div>
        <button
          className="mt-2 text-indigo-600 hover:underline text-sm"
          onClick={() => onNavigate('Retirement Pots')}
        >
          View pots →
        </button>
      </Section>

      <Section
        title="Update balances"
        actions={
          <button
            className="text-sm text-indigo-600 hover:underline"
            onClick={() => setShowBalanceForm((v) => !v)}
          >
            {showBalanceForm ? 'Hide' : 'Quick update'}
          </button>
        }
      >
        {showBalanceForm ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {config.savingsAccounts.map((acc) => (
              <NumberField
                key={acc.id}
                label={acc.name}
                value={acc.balance}
                suffix={acc.currency}
                onChange={(v) => updateAccountBalance(acc.id, v)}
              />
            ))}
            {config.retirementPots.map((pot) => (
              <NumberField
                key={pot.id}
                label={`${pot.name} balance`}
                value={pot.startBalance}
                suffix={pot.currency ?? 'EUR'}
                onChange={(v) => updatePotBalance(pot.id, v)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Edit account and pot balances without going to Settings.</p>
        )}
      </Section>
    </div>
  );
}
