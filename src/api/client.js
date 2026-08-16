import axios from 'axios';
import { clearSession } from '../auth.js';

// In dev, Vite proxies /api to the local backend (see vite.config.js).
// In prod, VITE_API_BASE_URL points at the deployed backend, e.g.
//   https://dawa-find-backend.onrender.com/api/v1
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Endpoints where a 401 is a normal answer, not a dead session: a wrong
// password must show "Invalid credentials", not bounce to the login page
// we're already on. Logging out with an expired token is also not a failure.
const AUTH_ENDPOINTS = /\/auth\/(login|register|logout)\b/;

// Several requests can 401 at once; only the first one should navigate.
let redirecting = false;

// A JWT can go stale between page loads — it expires (JWT_EXPIRES_IN, 7d by
// default) or the API restarts with a different JWT_SECRET. Without this the
// user just sees a raw "Token invalid or expired" wherever they happened to
// be, with no way to recover. Drop the dead session and send them to log in.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';

    if (status === 401 && !AUTH_ENDPOINTS.test(url) && typeof window !== 'undefined') {
      clearSession();
      const onAuthPage = /^\/(login|register)\b/.test(window.location.pathname);
      if (!redirecting && !onAuthPage) {
        redirecting = true;
        const next = window.location.pathname + window.location.search;
        window.location.assign(`/login?expired=1&next=${encodeURIComponent(next)}`);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
