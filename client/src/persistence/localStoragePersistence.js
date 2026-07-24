import { defaultConfig } from './defaultConfig.js';

// Used when there's no backend to persist to (the GitHub Pages demo build).
// Everything stays in this browser's localStorage - nothing is ever sent
// anywhere else.
const STORAGE_KEY = 'sparziele-rente-config';

export async function fetchConfig() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));
  return structuredClone(defaultConfig);
}

export async function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  return config;
}
