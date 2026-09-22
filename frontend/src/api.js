import axios from 'axios';

// Base URL — in prod Railway, in dev localhost:5000
const isProd = import.meta.env.PROD;
export const API_BASE = import.meta.env.VITE_API_URL
  || (isProd ? 'https://ajayfeedback-backend.onrender.com' : 'http://localhost:5000');

const baseURL = import.meta.env.VITE_API_URL
  || (isProd ? 'https://ajayfeedback-backend.onrender.com' : '');

export function getPdfUrl(report) {
  if (!report) return '#';
  const link = report.driveLink || report.pdfLink || '';
  if (link.startsWith('https://drive.google.com') || link.startsWith('https://storage.googleapis.com')) {
    return link;
  }
  if (report._id) {
    return `${API_BASE}/api/reports/${report._id}/pdf`;
  }
  if (link.startsWith('http://') || link.startsWith('https://')) {
    return link;
  }
  return link ? `${API_BASE}${link.startsWith('/') ? '' : '/'}${link}` : '#';
}

// ── Set global default so ALL axios calls (even raw `import axios from 'axios'`)
// use the correct backend URL in production. Without this, components like
// Login, Register, FacultyDashboard, HODDashboard, etc. would call relative
// paths that hit the frontend domain instead of the backend. ──────────────────
axios.defaults.baseURL = baseURL;

const api = axios.create({ baseURL });

// ── Request interceptor — attach JWT from localStorage automatically ─────────
// This means every api.get/post/patch/delete call in admin sections
// automatically sends the correct Authorization header without any extra code.
api.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore — bad localStorage value
  }
  return config;
});

// ── Response interceptor — auto-logout on 401 ───────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Token expired / invalid — clear auth and reload to login
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
