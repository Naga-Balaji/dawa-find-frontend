import axios from 'axios';

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

export default api;
