import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { computePots, computePotsGrowth, computePotsGrowthByPot } from '../calculations.js';
import { formatCurrency } from '../format.js';
import Section from './Section.jsx';

const POT_COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899', '#84cc16'];

function newPot() {
  return {
    id: `pot-${Date.now()}`,
    name: 'New pot',
    startBalance: 0,
    monthlyContribution: 0,
    annualInterestRate: 0.03,
    contributionLimitYears: null,
    currency: 'EUR',
  };
}

export default function RetirementPots({ config, onChange }) {
  const { pots, totalFull, totalLimited } = useMemo(() => computePots(config), [config]);
  const growth = useMemo(() => computePotsGrowth(config), [config]);
  const growthByPot = useMemo(() => computePotsGrowthByPot(config), [config]);
  const scenario = config.ui?.retirementPotsChartScenario ?? 'full';

  function updateScenario(nextScenario) {
    onChange({ ...config, ui: { ...config.ui, retirementPotsChartScenario: nextScenario } });
  }

  function updatePot(id, patch) {
    onChange({
      ...config,
      retirementPots: config.retirementPots.map((pot) => (pot.id === id ? { ...pot, ...patch } : pot)),
    });
  }

  function removePot(id) {
    const pot = config.retirementPots.find((p) => p.id === id);
    if (!window.confirm(`Remove "${pot?.name ?? 'this pot'}"? This can't be undone.`)) return;
    onChange({ ...config, retirementPots: config.retirementPots.filter((p) => p.id !== id) });
  }

  function addPot() {
    onChange({ ...config, retirementPots: [...config.retirementPots, newPot()] });
  }

  return (
    <div>
    <Section
      title="Retirement Pots"
      actions={
        <button onClick={addPot} className="text-sm text-indigo-600 hover:underline">
          + Add pot
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Balance</th>
              <th className="py-2 pr-3">Currency</th>
              <th className="py-2 pr-3">Monthly contribution</th>
              <th className="py-2 pr-3">Annual rate</th>
              <th className="py-2 pr-3">Contribution stops after</th>
              <th className="py-2 pr-3">Full projection (EUR)</th>
              <th className="py-2 pr-3">Limited projection (EUR)</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pots.map((pot) => (
              <tr key={pot.id} className="border-b border-gray-100">
                <td className="py-2 pr-3">
                  <input
                    className="w-56 rounded border border-gray-300 px-2 py-1"
                    value={pot.name}
                    onChange={(e) => updatePot(pot.id, { name: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    className="w-24 rounded border border-gray-300 px-2 py-1"
                    value={pot.startBalance}
                    onChange={(e) => updatePot(pot.id, { startBalance: Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <select
                    className="rounded border border-gray-300 px-2 py-1"
                    value={pot.currency ?? 'EUR'}
                    onChange={(e) => updatePot(pot.id, { currency: e.target.value })}
                  >
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    className="w-24 rounded border border-gray-300 px-2 py-1"
                    value={pot.monthlyContribution}
                    onChange={(e) => updatePot(pot.id, { monthlyContribution: Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    step="0.001"
                    className="w-20 rounded border border-gray-300 px-2 py-1"
                    value={pot.annualInterestRate}
                    onChange={(e) => updatePot(pot.id, { annualInterestRate: Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    placeholder="never"
                    className="w-20 rounded border border-gray-300 px-2 py-1"
                    value={pot.contributionLimitYears ?? ''}
                    onChange={(e) =>
                      updatePot(pot.id, {
                        contributionLimitYears: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                  <span className="text-xs text-gray-400 ml-1">yrs</span>
                </td>
                <td className="py-2 pr-3 font-medium text-gray-900">{formatCurrency(pot.projectedFull, 'EUR')}</td>
                <td className="py-2 pr-3 font-medium text-gray-900">{formatCurrency(pot.projectedLimited, 'EUR')}</td>
                <td className="py-2">
                  <button
                    onClick={() => removePot(pot.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Remove pot"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-gray-900">
              <td className="py-2 pr-3" colSpan={6}>
                Total (EUR)
              </td>
              <td className="py-2 pr-3">{formatCurrency(totalFull, 'EUR')}</td>
              <td className="py-2 pr-3">{formatCurrency(totalLimited, 'EUR')}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Section>

    <Section title="Projected growth">
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} width={90} />
            <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(y) => `Year ${y}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalFull"
              name="Full contribution"
              stroke="#4f46e5"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="totalLimited"
              name="Contributions stop early"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Section>

    <Section
      title="Growth by pot"
      actions={
        <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
          <button
            onClick={() => updateScenario('full')}
            className={`px-3 py-1 ${scenario === 'full' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Full contribution
          </button>
          <button
            onClick={() => updateScenario('limited')}
            className={`px-3 py-1 border-l border-gray-300 ${scenario === 'limited' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Contributions stop early
          </button>
        </div>
      }
    >
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <AreaChart data={growthByPot}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
            <YAxis tickFormatter={(v) => formatCurrency(v)} width={90} />
            <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(y) => `Year ${y}`} />
            <Legend />
            {pots.map((pot, i) => (
              <Area
                key={pot.id}
                type="monotone"
                dataKey={`${pot.id}_${scenario}`}
                name={pot.name}
                stackId="pots"
                stroke={POT_COLORS[i % POT_COLORS.length]}
                fill={POT_COLORS[i % POT_COLORS.length]}
                fillOpacity={0.7}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Section>
    </div>
  );
}
