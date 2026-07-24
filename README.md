# Sparziele & Rente Tracker

Personal savings goal / retirement projection / drawdown simulator app.
See `sparziele-rente-app-concept.md` for the original concept this was built from.

## Structure

- `server/` — Express backend. Its only job is to read/write `server/data/config.json`
  (no database — the config file *is* the persistence layer).
- `client/` — Vite + React frontend. `client/src/calculations.js` is the single
  source of truth for all financial math (compound interest projections,
  savings goal shortfall, drawdown simulation); the server imports it too so
  logic never diverges between validation and the UI.
- `server/data/config.json` — all persisted values (age, FX rates, retirement
  pots, savings accounts, savings goal, drawdown assumptions). Human-readable,
  hand-editable, but **contains real personal financial data** — it's
  gitignored, not committed.
- `server/data/config.example.json` — a sanitized template with placeholder
  values, safe to commit. The server auto-copies this to `config.json` on
  first run if `config.json` doesn't exist yet, so a fresh clone works
  immediately without a manual setup step.

## Running it

```bash
npm run install:all   # first time only: installs root, server, and client deps
npm run dev            # starts backend (port 3001) and frontend (port 5173)
```

Then open http://localhost:5173. The Vite dev server proxies `/api/*` to the
backend, so no CORS/URL configuration is needed. On first run the server
seeds `server/data/config.json` from `config.example.json` if it's missing —
edit the seeded values from the app itself.

## Pages

1. **Dashboard** — savings goal progress bar, projected retirement pot totals
   (full vs. contributions-stop-early), and a quick balance-update shortcut.
2. **Retirement Pots** — inline-editable table of pots with live-recalculated
   projections and combined totals.
3. **Savings Goal** — target/accounts editor, shortfall, required monthly
   savings rate (EUR/GBP), with a "redirect an existing contribution" toggle.
4. **Drawdown Simulator** — sliders for withdrawal amount, retirement interest
   rate, and simulation length, with a live balance-over-time chart.
5. **Settings** — the rarely-changed inputs: age, retirement age, FX rates,
   and drawdown defaults.

Edits debounce-save to `config.json` automatically; the header shows
Saving.../Saved status.

## Tests

```bash
cd client && npm test              # run the suite
cd client && npm run test:coverage # run with a coverage report
```

Covers the calculation engine (`calculations.test.js`) — currently 100%
statement/branch/function/line coverage: FV math, pot projections with
contribution limits and currency conversion, savings goal shortfall/FX
conversion (including GBP-denominated goals and past-due targets), and
drawdown depletion. UI components aren't unit-tested; this is a deliberate
scope choice for a single-user personal tool — the calculation engine is
where correctness actually matters, and it's covered.
