// Admin API client
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Accept-Language'] = localStorage.getItem('admin_lang') || 'ru';
  return config;
});

api.interceptors.response.use(
  r => r,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
