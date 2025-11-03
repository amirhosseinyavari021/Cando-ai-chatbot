// frontend/src/api/client.js
import axios from 'axios';

const API_BASE =
  (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : '');

const instance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.response.use(
  (r) => r,
  (err) => {
    // اگر سرور HTML برگرداند، یک خطای خوانا بدهیم
    if (err?.response && typeof err.response.data === 'string') {
      return Promise.reject(new Error('Server returned an error.'));
    }
    return Promise.reject(err);
  }
);

export default instance;