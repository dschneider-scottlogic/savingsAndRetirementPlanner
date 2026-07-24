// Seed data for the localStorage persistence mode (used when there's no
// backend, e.g. the GitHub Pages demo). Mirrors server/data/config.example.json
// - keep the two in sync if you change one.
export const defaultConfig = {
  ui: {
    retirementPotsChartScenario: 'full',
  },
  personal: {
    currentAge: 30,
    targetRetirementAge: 65,
  },
  fx: {
    gbpToEur: 1.15,
    eurToGbp: 0.87,
  },
  savingsGoal: {
    targetAmount: 20000,
    targetDate: '2028-12-31',
    currency: 'EUR',
    includedPotIds: [],
  },
  retirementPots: [
    {
      id: 'example-etf',
      name: 'Example ETF',
      startBalance: 10000,
      monthlyContribution: 200,
      annualInterestRate: 0.04,
      contributionLimitYears: null,
      currency: 'EUR',
    },
    {
      id: 'example-workplace-pension',
      name: 'Example Workplace Pension',
      startBalance: 0,
      monthlyContribution: 300,
      annualInterestRate: 0.03,
      contributionLimitYears: null,
      currency: 'GBP',
    },
  ],
  savingsAccounts: [{ id: 'example-savings', name: 'Example Savings Account', balance: 1000, currency: 'EUR' }],
  drawdown: {
    assumedInterestRate: 0.03,
    durationsYears: [25, 30, 35, 40, 45],
    annualAmounts: [35000, 40000, 45000, 50000],
    simulator: {
      potChoice: 'full',
      annualWithdrawal: 40000,
      annualInterestRate: 0.03,
      maxDurationYears: 40,
    },
  },
};
