import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');
const CONFIG_EXAMPLE_PATH = path.join(__dirname, '..', 'data', 'config.example.json');

const REQUIRED_KEYS = ['personal', 'fx', 'savingsGoal', 'retirementPots', 'savingsAccounts', 'drawdown'];

function isValidConfig(config) {
  return (
    config &&
    typeof config === 'object' &&
    REQUIRED_KEYS.every((key) => Object.prototype.hasOwnProperty.call(config, key))
  );
}

// config.json holds personal financial data and is gitignored, so a fresh
// clone won't have one yet — seed it from the committed example template.
async function ensureConfigExists() {
  try {
    await fs.access(CONFIG_PATH);
  } catch {
    await fs.copyFile(CONFIG_EXAMPLE_PATH, CONFIG_PATH);
    console.log(`No config.json found — seeded one from config.example.json at ${CONFIG_PATH}`);
  }
}

async function readConfig() {
  const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeConfig(config) {
  const tmpPath = `${CONFIG_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(config, null, 2), 'utf-8');
  await fs.rename(tmpPath, CONFIG_PATH);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/config', async (req, res) => {
  try {
    const config = await readConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read config', details: err.message });
  }
});

app.put('/api/config', async (req, res) => {
  const config = req.body;
  if (!isValidConfig(config)) {
    res.status(400).json({ error: `Config must include: ${REQUIRED_KEYS.join(', ')}` });
    return;
  }
  try {
    await writeConfig(config);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to write config', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
ensureConfigExists().then(() => {
  app.listen(PORT, () => {
    console.log(`Savings & Retirement Tracker server listening on http://localhost:${PORT}`);
  });
});
