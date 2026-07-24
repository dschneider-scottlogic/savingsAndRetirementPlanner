// Talks to the Express backend (server/src/index.js), which persists to
// server/data/config.json. Used whenever the app is running against a real
// backend - local dev, or a self-hosted deployment. Not used in the
// GitHub Pages build, which has no backend to talk to (see localStoragePersistence.js).

export async function fetchConfig() {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
  return res.json();
}

export async function saveConfig(config, { keepalive = false } = {}) {
  const res = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
    // keepalive lets this request outlive page unload, so a save
    // triggered right before a refresh/close still lands (see App.jsx's
    // beforeunload/pagehide flush of any pending debounced save).
    keepalive,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to save config: ${res.status}`);
  }
  return res.json();
}
