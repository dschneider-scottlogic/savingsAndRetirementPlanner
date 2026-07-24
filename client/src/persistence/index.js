import * as apiPersistence from './apiPersistence.js';
import * as localStoragePersistence from './localStoragePersistence.js';

// Set VITE_PERSISTENCE=local-storage at build time (only done for the
// GitHub Pages demo build, see .github/workflows/deploy-pages.yml) to use
// browser-only persistence instead of the Express backend. Local dev and
// self-hosted builds leave this unset, so they keep talking to the backend
// exactly as before.
export const isDemoMode = import.meta.env.VITE_PERSISTENCE === 'local-storage';

const impl = isDemoMode ? localStoragePersistence : apiPersistence;

export const fetchConfig = impl.fetchConfig;
export const saveConfig = impl.saveConfig;
