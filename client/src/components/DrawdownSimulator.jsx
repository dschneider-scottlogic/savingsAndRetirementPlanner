import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { computePots, simulateDrawdown } from '../calculations.js';
import { formatCurrency } from '../format.js';
import Section from './Section.jsx';
import SliderField from './fields/SliderField.jsx';

function defaultSimulatorState(config) {
  return {
    potChoice: 'full',
    annualWithdrawal: config.drawdown.annualAmounts[0] ?? 40000,
    annualInterestRate: config.drawdown.assumedInterestRate,
    maxDurationYears: config.drawdown.durationsYears[config.drawdown.durationsYears.length - 1] ?? 40,
  };
}

export default function DrawdownSimulator({ config, onChange }) {
  const { totalFull, totalLimited } = useMemo(() => computePots(config), [config]);

  const simulator = { ...defaultSimulatorState(config), ...config.drawdown.simulator };
  const { potChoice, annualWithdrawal, annualInterestRate, maxDurationYears } = simulator;

  function updateSimulator(patch) {
    onChange({
      ...config,
      drawdown: { ...config.drawdown, simulator: { ...simulator, ...patch } },
    });
  }

  const startingPot = potChoice === 'full' ? totalFull : totalLimited;

  const { points, depletionYear } = useMemo(
    () => simulateDrawdown(startingPot, annualWithdrawal, annualInterestRate, maxDurationYears),
    [startingPot, annualWithdrawal, annualInterestRate, maxDurationYears]
  );

  return (
    <div>
      <Section title="Drawdown Simulator">
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm text-gray-600 mb-1">Starting pot</span>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={potChoice}
                onChange={(e) => updateSimulator({ potChoice: e.target.value })}
              >
                <option value="full">Full contribution scenario ({formatCurrency(totalFull)})</option>
                <option value="limited">Contributions-stop-early scenario ({formatCurrency(totalLimited)})</option>
              </select>
            </label>

            <SliderField
              label="Annual withdrawal"
              value={annualWithdrawal}
              onChange={(v) => updateSimulator({ annualWithdrawal: v })}
              min={10000}
              max={100000}
              step={1000}
              format={(v) => formatCurrency(v)}
            />

            <SliderField
              label="Assumed interest rate during retirement"
              value={annualInterestRate}
              onChange={(v) => updateSimulator({ annualInterestRate: v })}
              min={0}
              max={0.1}
              step={0.005}
              format={(v) => `${(v * 100).toFixed(1)}%`}
            />

            <SliderField
              label="Max duration to simulate"
              value={maxDurationYears}
              onChange={(v) => updateSimulator({ maxDurationYears: v })}
              min={10}
              max={50}
              step={1}
              format={(v) => `${v} years`}
            />
          </div>

          <div className="rounded-md bg-gray-50 p-4 flex flex-col justify-center">
            <div className="text-xs uppercase text-gray-500 mb-1">Result</div>
            {depletionYear != null ? (
              <div className="text-lg font-semibold text-red-600">Pot depletes in year {depletionYear}</div>
            ) : (
              <div className="text-lg font-semibold text-green-600">
                Pot lasts the full {maxDurationYears} years
              </div>
            )}
            <div className="text-sm text-gray-500 mt-1">
              Ending balance: {formatCurrency(points[points.length - 1].balance)}
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis tickFormatter={(v) => formatCurrency(v)} width={90} />
              <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(y) => `Year ${y}`} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#4f46e5"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  );
}
