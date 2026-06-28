// Axios API client
import axios from 'axios';
import { API_URL } from '../utils/config';
import { getToken, removeToken } from '../utils/storage';
import i18n from '../i18n';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Token + til / Attach token and language to requests
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Accept-Language'] = i18n.language || 'ru';
  return config;
});

// 401 da chiqish / Handle 401 logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { useAuthStore } = await import('../store/authStore');
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
