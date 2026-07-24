import { describe, it, expect } from 'vitest';
import {
  fv,
  toCurrency,
  monthsToRetirement,
  projectPot,
  computePots,
  computePotsGrowth,
  computePotsGrowthByPot,
  computeSavingsGoal,
  simulateDrawdown,
  sustainablePot,
} from './calculations.js';

describe('toCurrency', () => {
  const fx = { base: 'EUR', rates: { EUR: 1, GBP: 0.87 } };

  it('returns the amount unchanged when currencies match', () => {
    expect(toCurrency(100, 'EUR', 'EUR', fx)).toBe(100);
  });

  it('converts EUR to GBP', () => {
    expect(toCurrency(100, 'EUR', 'GBP', fx)).toBeCloseTo(87, 6);
  });

  it('converts GBP to EUR', () => {
    expect(toCurrency(100, 'GBP', 'EUR', fx)).toBeCloseTo(100 / 0.87, 6);
  });

  it('converts between two non-base currencies via the base', () => {
    const threeWayFx = { base: 'EUR', rates: { EUR: 1, GBP: 0.87, USD: 1.08 } };
    expect(toCurrency(100, 'GBP', 'USD', threeWayFx)).toBeCloseTo((100 / 0.87) * 1.08, 6);
  });

  it('returns the amount unchanged for a currency missing from the rates table', () => {
    expect(toCurrency(100, 'USD', 'EUR', fx)).toBe(100);
  });
});

describe('monthsToRetirement', () => {
  it('clamps to 0 when retirement age has already passed', () => {
    expect(monthsToRetirement({ currentAge: 70, targetRetirementAge: 65 })).toBe(0);
  });
});

describe('fv', () => {
  it('handles zero rate as simple sum', () => {
    expect(fv(0, 12, 100, 1000)).toBe(1000 + 100 * 12);
  });

  it('handles zero months as the starting balance', () => {
    expect(fv(0.01, 0, 100, 1000)).toBe(1000);
  });

  it('compounds a starting balance with monthly contributions', () => {
    const result = fv(0.01, 12, 100, 1000);
    // pv * (1+r)^n + pmt * ((1+r)^n - 1) / r
    const expected = 1000 * Math.pow(1.01, 12) + 100 * ((Math.pow(1.01, 12) - 1) / 0.01);
    expect(result).toBeCloseTo(expected, 6);
  });
});

describe('projectPot', () => {
  it('matches full fv when there is no contribution limit', () => {
    const pot = { annualInterestRate: 0.12, monthlyContribution: 100, startBalance: 1000, contributionLimitYears: null };
    const projected = projectPot(pot, 24);
    expect(projected.projectedFull).toBeCloseTo(projected.projectedLimited, 6);
  });

  it('grows untouched after contributions stop for a limited pot', () => {
    const pot = { annualInterestRate: 0.12, monthlyContribution: 100, startBalance: 1000, contributionLimitYears: 1 };
    const projected = projectPot(pot, 24);
    // limited should be less than full since contributions stop after year 1
    expect(projected.projectedLimited).toBeLessThan(projected.projectedFull);
  });

  it('treats a pot with no currency as already in EUR (no conversion)', () => {
    const pot = { annualInterestRate: 0, monthlyContribution: 100, startBalance: 1000, contributionLimitYears: null };
    const fx = { base: 'EUR', rates: { EUR: 1, GBP: 0.87 } };
    const projected = projectPot(pot, 12, fx);
    expect(projected.projectedFull).toBeCloseTo(1000 + 100 * 12, 6);
  });

  it('converts a GBP pot to EUR before compounding', () => {
    const pot = {
      annualInterestRate: 0,
      monthlyContribution: 100,
      startBalance: 1000,
      contributionLimitYears: null,
      currency: 'GBP',
    };
    const fx = { base: 'EUR', rates: { EUR: 1, GBP: 0.87 } };
    const projected = projectPot(pot, 12, fx);
    expect(projected.projectedFull).toBeCloseTo((1000 + 100 * 12) / 0.87, 6);
  });

  it('matches full projection when the contribution limit exceeds the horizon', () => {
    // contributionLimitYears (10 years) is longer than the 12-month horizon,
    // so contributions never actually stop within it.
    const pot = { annualInterestRate: 0.12, monthlyContribution: 100, startBalance: 1000, contributionLimitYears: 10 };
    const projected = projectPot(pot, 12);
    expect(projected.projectedLimited).toBeCloseTo(projected.projectedFull, 6);
  });
});

describe('computePots', () => {
  it('sums totals across multiple pots', () => {
    const config = {
      personal: { currentAge: 30, targetRetirementAge: 32 },
      retirementPots: [
        { id: 'a', annualInterestRate: 0, monthlyContribution: 100, startBalance: 0, contributionLimitYears: null },
        { id: 'b', annualInterestRate: 0, monthlyContribution: 50, startBalance: 500, contributionLimitYears: null },
      ],
    };
    const now = new Date(2024, 0, 1);
    const { totalFull, monthsRemaining } = computePots(config, now);
    expect(monthsRemaining).toBe(24);
    expect(totalFull).toBeCloseTo(100 * 24 + (500 + 50 * 24), 6);
  });

  it('converts GBP pots to EUR before summing with EUR pots', () => {
    const config = {
      personal: { currentAge: 30, targetRetirementAge: 32 },
      fx: { base: 'EUR', rates: { EUR: 1, GBP: 0.87 } },
      retirementPots: [
        { id: 'eur', annualInterestRate: 0, monthlyContribution: 0, startBalance: 1000, contributionLimitYears: null, currency: 'EUR' },
        { id: 'gbp', annualInterestRate: 0, monthlyContribution: 0, startBalance: 1000, contributionLimitYears: null, currency: 'GBP' },
      ],
    };
    const now = new Date(2024, 0, 1);
    const { totalFull } = computePots(config, now);
    expect(totalFull).toBeCloseTo(1000 + 1000 / 0.87, 6);
  });
});

describe('computePotsGrowth', () => {
  const config = {
    personal: { currentAge: 30, targetRetirementAge: 32 },
    retirementPots: [
      { id: 'a', annualInterestRate: 0, monthlyContribution: 100, startBalance: 0, contributionLimitYears: null },
    ],
  };
  const now = new Date(2024, 0, 1);

  it('starts at year 0 with the starting balance and ends at the final projection', () => {
    const points = computePotsGrowth(config, now);
    const { totalFull } = computePots(config, now);
    expect(points[0]).toEqual({ year: 0, totalFull: 0, totalLimited: 0 });
    expect(points[points.length - 1].totalFull).toBeCloseTo(totalFull, 6);
  });

  it('produces one point per year up to retirement', () => {
    const points = computePotsGrowth(config, now);
    expect(points.map((p) => p.year)).toEqual([0, 1, 2]);
  });

  it('increases monotonically when contributions are positive and rate is non-negative', () => {
    const points = computePotsGrowth(config, now);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].totalFull).toBeGreaterThanOrEqual(points[i - 1].totalFull);
    }
  });
});

describe('computePotsGrowthByPot', () => {
  const config = {
    personal: { currentAge: 30, targetRetirementAge: 32 },
    retirementPots: [
      { id: 'a', annualInterestRate: 0, monthlyContribution: 100, startBalance: 0, contributionLimitYears: null },
      { id: 'b', annualInterestRate: 0, monthlyContribution: 50, startBalance: 500, contributionLimitYears: 1 },
    ],
  };
  const now = new Date(2024, 0, 1);

  it('gives each pot its own full/limited keys at every year', () => {
    const points = computePotsGrowthByPot(config, now);
    expect(points[0]).toEqual({ year: 0, a_full: 0, a_limited: 0, b_full: 500, b_limited: 500 });
  });

  it('sums back to the combined totals from computePots', () => {
    const points = computePotsGrowthByPot(config, now);
    const { totalFull, totalLimited } = computePots(config, now);
    const last = points[points.length - 1];
    expect(last.a_full + last.b_full).toBeCloseTo(totalFull, 6);
    expect(last.a_limited + last.b_limited).toBeCloseTo(totalLimited, 6);
  });
});

describe('computeSavingsGoal', () => {
  const fx = { base: 'EUR', rates: { EUR: 1, GBP: 0.87 } };

  it('converts account balances to the goal currency and computes shortfall', () => {
    const config = {
      savingsGoal: { targetAmount: 10000, targetDate: '2025-01-01', currency: 'EUR' },
      savingsAccounts: [
        { balance: 1000, currency: 'EUR' },
        { balance: 1000, currency: 'GBP' },
      ],
      fx,
    };
    const now = new Date(2024, 0, 1);
    const result = computeSavingsGoal(config, now);
    const gbpInEur = 1000 / 0.87;
    expect(result.totalSaved).toBeCloseTo(1000 + gbpInEur, 6);
    expect(result.monthsRemaining).toBe(12);
    expect(result.shortfall).toBeCloseTo(10000 - (1000 + gbpInEur), 6);
  });

  it('increases the required monthly amount by extra existing contributions', () => {
    const config = {
      savingsGoal: { targetAmount: 10000, targetDate: '2025-01-01', currency: 'EUR' },
      savingsAccounts: [{ balance: 0, currency: 'EUR' }],
      fx,
    };
    const now = new Date(2024, 0, 1);
    const withoutExtra = computeSavingsGoal(config, now, 0);
    const withExtra = computeSavingsGoal(config, now, 200);
    expect(withExtra.requiredPerMonth).toBeCloseTo(withoutExtra.requiredPerMonth + 200, 6);
  });

  it('falls back to the raw shortfall when the target date has already passed', () => {
    const config = {
      savingsGoal: { targetAmount: 10000, targetDate: '2020-01-01', currency: 'EUR' },
      savingsAccounts: [{ balance: 4000, currency: 'EUR' }],
      fx,
    };
    const now = new Date(2024, 0, 1);
    const result = computeSavingsGoal(config, now);
    expect(result.monthsRemaining).toBe(0);
    expect(result.requiredPerMonth).toBeCloseTo(6000, 6);
  });

  it('converts required-per-month into both currencies when the goal is in GBP', () => {
    const config = {
      savingsGoal: { targetAmount: 10000, targetDate: '2025-01-01', currency: 'GBP' },
      savingsAccounts: [{ balance: 0, currency: 'GBP' }],
      fx,
    };
    const now = new Date(2024, 0, 1);
    const result = computeSavingsGoal(config, now);
    expect(result.requiredPerMonthGBP).toBeCloseTo(result.requiredPerMonth, 6);
    expect(result.requiredPerMonthEUR).toBeCloseTo(result.requiredPerMonth / 0.87, 6);
  });

  it('reports 0% complete when the target amount is 0', () => {
    const config = {
      savingsGoal: { targetAmount: 0, targetDate: '2025-01-01', currency: 'EUR' },
      savingsAccounts: [{ balance: 500, currency: 'EUR' }],
      fx,
    };
    const result = computeSavingsGoal(config, new Date(2024, 0, 1));
    expect(result.percentComplete).toBe(0);
  });

  it('caps percentComplete at 100 when saved past the target', () => {
    const config = {
      savingsGoal: { targetAmount: 1000, targetDate: '2025-01-01', currency: 'EUR' },
      savingsAccounts: [{ balance: 5000, currency: 'EUR' }],
      fx,
    };
    const result = computeSavingsGoal(config, new Date(2024, 0, 1));
    expect(result.percentComplete).toBe(100);
  });
});

describe('simulateDrawdown', () => {
  it('depletes the pot and reports the depletion year', () => {
    const { points, depletionYear } = simulateDrawdown(1000, 600, 0, 10);
    expect(depletionYear).toBe(2);
    expect(points[points.length - 1].balance).toBe(0);
  });

  it('never depletes when growth outpaces withdrawal', () => {
    const { depletionYear, points } = simulateDrawdown(100000, 1000, 0.05, 30);
    expect(depletionYear).toBeNull();
    expect(points.length).toBe(31);
  });
});

describe('sustainablePot', () => {
  it('returns the pot size where annual withdrawal equals interest earned', () => {
    expect(sustainablePot(4000, 0.04)).toBeCloseTo(100000, 6);
  });

  it('returns null when the interest rate is zero or negative', () => {
    expect(sustainablePot(1000, 0)).toBeNull();
    expect(sustainablePot(1000, -0.02)).toBeNull();
  });

  it('matches simulateDrawdown: starting exactly at this pot holds the balance steady', () => {
    const pot = sustainablePot(4000, 0.04);
    const { points } = simulateDrawdown(pot, 4000, 0.04, 10);
    for (const point of points) {
      expect(point.balance).toBeCloseTo(pot, 6);
    }
  });
});
