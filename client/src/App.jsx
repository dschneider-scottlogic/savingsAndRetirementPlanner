import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchConfig, saveConfig } from './api.js';
import Nav from './components/Nav.jsx';
import Dashboard from './components/Dashboard.jsx';
import RetirementPots from './components/RetirementPots.jsx';
import SavingsGoal from './components/SavingsGoal.jsx';
import DrawdownSimulator from './components/DrawdownSimulator.jsx';
import Settings from './components/Settings.jsx';

const PAGES = ['Dashboard', 'Retirement Pots', 'Savings Goal', 'Drawdown Simulator', 'Settings'];
const SAVE_DEBOUNCE_MS = 600;

export default function App() {
  const [config, setConfig] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [page, setPage] = useState(PAGES[0]);
  const saveTimeout = useRef(null);
  const pendingConfig = useRef(null);

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch((err) => setLoadError(err.message));
  }, []);

  // A debounced save waiting out its timer is invisible to a page
  // refresh/close — the timeout is destroyed with the page before it ever
  // fires, silently dropping the edit. Flush it immediately (via a
  // keepalive fetch, which survives navigation) whenever the page is about
  // to go away.
  useEffect(() => {
    function flushPendingSave() {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
        saveConfig(pendingConfig.current, { keepalive: true }).catch(() => {});
      }
    }
    window.addEventListener('beforeunload', flushPendingSave);
    window.addEventListener('pagehide', flushPendingSave);
    return () => {
      window.removeEventListener('beforeunload', flushPendingSave);
      window.removeEventListener('pagehide', flushPendingSave);
    };
  }, []);

  const handleChange = useCallback((nextConfig) => {
    setConfig(nextConfig);
    setSaveStatus('saving');
    pendingConfig.current = nextConfig;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveTimeout.current = null;
      saveConfig(nextConfig)
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'));
    }, SAVE_DEBOUNCE_MS);
  }, []);

  if (loadError) {
    return (
      <div className="p-8 text-red-600">
        Failed to load config from the server: {loadError}. Is the backend running on port 3001?
      </div>
    );
  }

  if (!config) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Sparziele &amp; Rente Tracker</h1>
        <SaveIndicator status={saveStatus} />
      </header>
      <Nav pages={PAGES} current={page} onSelect={setPage} />
      <main className="max-w-5xl mx-auto p-6">
        {page === 'Dashboard' && <Dashboard config={config} onChange={handleChange} onNavigate={setPage} />}
        {page === 'Retirement Pots' && <RetirementPots config={config} onChange={handleChange} />}
        {page === 'Savings Goal' && <SavingsGoal config={config} onChange={handleChange} />}
        {page === 'Drawdown Simulator' && <DrawdownSimulator config={config} onChange={handleChange} />}
        {page === 'Settings' && <Settings config={config} onChange={handleChange} />}
      </main>
    </div>
  );
}

function SaveIndicator({ status }) {
  const label = {
    idle: '',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Failed to save',
  }[status];

  const color = {
    idle: 'text-gray-400',
    saving: 'text-gray-400',
    saved: 'text-green-600',
    error: 'text-red-600',
  }[status];

  return <span className={`text-sm ${color}`}>{label}</span>;
}
