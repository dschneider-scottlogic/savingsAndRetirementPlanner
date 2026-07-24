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
