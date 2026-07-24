import Section from './Section.jsx';
import NumberField from './fields/NumberField.jsx';

export default function Settings({ config, onChange }) {
  function updatePersonal(patch) {
    onChange({ ...config, personal: { ...config.personal, ...patch } });
  }

  function updateFx(patch) {
    onChange({ ...config, fx: { ...config.fx, ...patch } });
  }

  function updateDrawdown(patch) {
    onChange({ ...config, drawdown: { ...config.drawdown, ...patch } });
  }

  function updateDurationsList(text) {
    const values = text
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => !Number.isNaN(v));
    updateDrawdown({ durationsYears: values });
  }

  function updateAmountsList(text) {
    const values = text
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => !Number.isNaN(v));
    updateDrawdown({ annualAmounts: values });
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

      <Section title="Exchange rates">
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField
            label="GBP → EUR"
            value={config.fx.gbpToEur}
            step="0.01"
            onChange={(v) => updateFx({ gbpToEur: v })}
          />
          <NumberField
            label="EUR → GBP"
            value={config.fx.eurToGbp}
            step="0.01"
            onChange={(v) => updateFx({ eurToGbp: v })}
          />
        </div>
      </Section>

      <Section title="Drawdown defaults">
        <div className="grid sm:grid-cols-1 gap-4">
          <NumberField
            label="Assumed interest rate during retirement"
            value={config.drawdown.assumedInterestRate}
            step="0.005"
            onChange={(v) => updateDrawdown({ assumedInterestRate: v })}
          />
          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Durations to compare (years, comma-separated)</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              defaultValue={config.drawdown.durationsYears.join(', ')}
              onBlur={(e) => updateDurationsList(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">
              Annual withdrawal amounts to compare (comma-separated)
            </span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              defaultValue={config.drawdown.annualAmounts.join(', ')}
              onBlur={(e) => updateAmountsList(e.target.value)}
            />
          </label>
        </div>
      </Section>

      <p className="text-xs text-gray-400">
        Retirement pot and savings account definitions are edited on their own pages so live
        recalculation is visible immediately.
      </p>
    </div>
  );
}
