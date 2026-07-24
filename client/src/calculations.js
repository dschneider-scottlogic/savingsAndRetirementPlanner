// Pure calculation engine, shared verbatim between client (live UI recalculation)
// and server (validation / potential future non-browser use). No framework or
// runtime-specific APIs so it works unmodified under both Vite and Node ESM.

/** Future value of a series of monthly contributions plus a starting balance. */
export function fv(monthlyRate, months, monthlyContribution, startBalance) {
  if (months <= 0) return startBalance;
  if (monthlyRate === 0) return startBalance + monthlyContribution * months;
  const growth = Math.pow(1 + monthlyRate, months);
  return startBalance * growth + monthlyContribution * ((growth - 1) / monthlyRate);
}

function monthsBetween(fromDate, toDate) {
  const months =
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
    (toDate.getMonth() - fromDate.getMonth());
  return Math.max(0, months);
}

export function toCurrency(amount, fromCurrency, toCurrency_, fx) {
  if (fromCurrency === toCurrency_) return amount;
  if (fromCurrency === 'GBP' && toCurrency_ === 'EUR') return amount * fx.gbpToEur;
  if (fromCurrency === 'EUR' && toCurrency_ === 'GBP') return amount * fx.eurToGbp;
  return amount;
}

// Retirement pot totals are always shown in EUR (no per-total currency
// toggle, unlike the savings goal), so pots are converted to this base
// before compounding rather than carrying a currency through the math.
const POT_BASE_CURRENCY = 'EUR';
const IDENTITY_FX = { gbpToEur: 1, eurToGbp: 1 };

/** Months remaining until the person reaches targetRetirementAge, from "now". */
export function monthsToRetirement(personal, now = new Date()) {
  const yearsRemaining = personal.targetRetirementAge - personal.currentAge;
  return Math.max(0, Math.round(yearsRemaining * 12));
}

/**
 * Projects a single retirement pot to retirement, converting its balance
 * and contribution to EUR first if it's held in another currency (e.g. a
 * UK workplace pension paid in GBP alongside a EUR ETF). Returns both the
 * "full" (contribute all the way) and "limited" (contributions stop after
 * contributionLimitYears) projections, in EUR.
 */
export function projectPot(pot, monthsRemaining, fx = IDENTITY_FX) {
  const potCurrency = pot.currency ?? POT_BASE_CURRENCY;
  const startBalance = toCurrency(pot.startBalance, potCurrency, POT_BASE_CURRENCY, fx);
  const monthlyContribution = toCurrency(pot.monthlyContribution, potCurrency, POT_BASE_CURRENCY, fx);

  const monthlyRate = pot.annualInterestRate / 12;
  const full = fv(monthlyRate, monthsRemaining, monthlyContribution, startBalance);

  let limited = full;
  if (pot.contributionLimitYears != null) {
    const contributionMonths = Math.min(pot.contributionLimitYears * 12, monthsRemaining);
    const phase1 = fv(monthlyRate, contributionMonths, monthlyContribution, startBalance);
    const remainingMonths = monthsRemaining - contributionMonths;
    limited = fv(monthlyRate, remainingMonths, 0, phase1);
  }

  return { ...pot, projectedFull: full, projectedLimited: limited };
}

/** Projects every pot (converted to EUR) and sums the totals. */
export function computePots(config, now = new Date()) {
  const remaining = monthsToRetirement(config.personal, now);
  const pots = config.retirementPots.map((pot) => projectPot(pot, remaining, config.fx));
  const totalFull = pots.reduce((sum, p) => sum + p.projectedFull, 0);
  const totalLimited = pots.reduce((sum, p) => sum + p.projectedLimited, 0);
  return { pots, totalFull, totalLimited, monthsRemaining: remaining };
}

/**
 * Combined pot balance at each year from now to retirement, for both
 * scenarios — the trajectory behind the `computePots` end totals, for
 * charting expected growth over time. `projectPot` already accepts any
 * month count, so re-running it at each year mark gives the exact
 * compound-interest value at that point (no simulation drift).
 */
export function computePotsGrowth(config, now = new Date()) {
  const totalMonths = monthsToRetirement(config.personal, now);
  const totalYears = Math.ceil(totalMonths / 12);

  const points = [];
  for (let year = 0; year <= totalYears; year++) {
    const months = Math.min(year * 12, totalMonths);
    let totalFull = 0;
    let totalLimited = 0;
    for (const pot of config.retirementPots) {
      const projected = projectPot(pot, months, config.fx);
      totalFull += projected.projectedFull;
      totalLimited += projected.projectedLimited;
    }
    points.push({ year, totalFull, totalLimited });
  }
  return points;
}

/**
 * Same year-by-year trajectory as `computePotsGrowth`, but broken down per
 * pot instead of summed, so a stacked chart can show each pot's share of
 * the total. Each point carries both `<potId>_full` and `<potId>_limited`
 * keys so the caller can switch scenarios without recomputing.
 */
export function computePotsGrowthByPot(config, now = new Date()) {
  const totalMonths = monthsToRetirement(config.personal, now);
  const totalYears = Math.ceil(totalMonths / 12);

  const points = [];
  for (let year = 0; year <= totalYears; year++) {
    const months = Math.min(year * 12, totalMonths);
    const point = { year };
    for (const pot of config.retirementPots) {
      const projected = projectPot(pot, months, config.fx);
      point[`${pot.id}_full`] = projected.projectedFull;
      point[`${pot.id}_limited`] = projected.projectedLimited;
    }
    points.push(point);
  }
  return points;
}

/**
 * Savings goal progress: total saved (converted to goal currency), shortfall,
 * and required monthly savings rate to close it by the target date.
 * `extraMonthlyContributions` (optional) adds already-committed pot
 * contributions on top, since that money isn't available for this goal —
 * it shows the total combined monthly savings commitment, not a discount.
 */
export function computeSavingsGoal(config, now = new Date(), extraMonthlyContributions = 0) {
  const { savingsGoal, savingsAccounts, fx } = config;
  const totalSaved = savingsAccounts.reduce(
    (sum, acc) => sum + toCurrency(acc.balance, acc.currency, savingsGoal.currency, fx),
    0
  );
  const shortfall = savingsGoal.targetAmount - totalSaved;
  const target = new Date(savingsGoal.targetDate);
  const monthsRemaining = monthsBetween(now, target);
  const rawRequiredPerMonth = monthsRemaining > 0 ? shortfall / monthsRemaining : shortfall;
  const requiredPerMonth = Math.max(0, rawRequiredPerMonth) + extraMonthlyContributions;

  const requiredPerMonthEUR =
    savingsGoal.currency === 'EUR' ? requiredPerMonth : toCurrency(requiredPerMonth, 'GBP', 'EUR', fx);
  const requiredPerMonthGBP =
    savingsGoal.currency === 'GBP' ? requiredPerMonth : toCurrency(requiredPerMonth, 'EUR', 'GBP', fx);

  const percentComplete = savingsGoal.targetAmount > 0
    ? Math.min(100, Math.max(0, (totalSaved / savingsGoal.targetAmount) * 100))
    : 0;

  return {
    totalSaved,
    shortfall,
    monthsRemaining,
    requiredPerMonth,
    requiredPerMonthEUR,
    requiredPerMonthGBP,
    percentComplete,
    currency: savingsGoal.currency,
  };
}

/**
 * Year-by-year drawdown simulation starting from `startingPot`, withdrawing
 * `annualWithdrawal` at the end of each year and growing the remainder at
 * `annualInterestRate`. Stops early once the pot is depleted.
 */
export function simulateDrawdown(startingPot, annualWithdrawal, annualInterestRate, maxDurationYears) {
  const points = [{ year: 0, balance: startingPot }];
  let balance = startingPot;
  let depletionYear = null;

  for (let year = 1; year <= maxDurationYears; year++) {
    balance = balance * (1 + annualInterestRate) - annualWithdrawal;
    if (balance < 0) balance = 0;
    points.push({ year, balance });
    if (balance <= 0 && depletionYear === null) {
      depletionYear = year;
      break;
    }
  }

  return { points, depletionYear };
}
