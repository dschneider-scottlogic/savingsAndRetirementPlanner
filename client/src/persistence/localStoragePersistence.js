import { defaultConfig } from './defaultConfig.js';

// Used when there's no backend to persist to (the GitHub Pages demo build).
// Everything stays in this browser's localStorage - nothing is ever sent
// anywhere else.
const STORAGE_KEY = 'sparziele-rente-config';

// Bump whenever config's shape changes in a way older stored data can't
// satisfy (e.g. fx gained a required `rates` field) - a mismatched version
// means the visitor cached a config from before that change, so it's
// discarded and reseeded rather than crashing the app on load. This is only
// demo/placeholder data, so silently resetting it is fine.
const SCHEMA_VERSION = 2;
const VERSION_KEY = 'sparziele-rente-config-version';

export async function fetchConfig() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const storedVersion = Number(localStorage.getItem(VERSION_KEY));
  if (raw && storedVersion === SCHEMA_VERSION) return JSON.parse(raw);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));
  localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
  return structuredClone(defaultConfig);
}

export async function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
  return config;
}
