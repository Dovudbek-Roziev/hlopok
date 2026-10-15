// Auth API / Authentication API calls
import api from './client';
import { getPushToken } from '../utils/storage';

export const authApi = {
  sendOTP:              (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOTP:            (phone: string, code: string) => api.post('/auth/verify-otp', { phone, code }),
  register:             (data: any) => api.post('/auth/register', data),
  loginByPhone:         (phone: string, password: string) => api.post('/auth/login', { phone, password }),
  getMe:          () => api.get('/auth/me'),
  updateProfile:  (data: any) => api.put('/auth/profile', data),
  changePassword: async (oldPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { oldPassword, newPassword, pushToken: await getPushToken() }),
  getFavorites:   () => api.get('/auth/favorites'),
  clearFavorites: () => api.delete('/auth/favorites'),
  toggleFavorite: (productId: string) => api.post(`/auth/favorites/${productId}`),
  addAddress:     (data: any) => api.post('/auth/addresses', data),
  deleteAddress:  (addressId: string) => api.delete(`/auth/addresses/${addressId}`),
  savePushToken:  (token: string) => api.put('/auth/push-token', { token }),
  deleteAccount:  (password: string) => api.delete('/auth/account', { data: { password } }),
  getBlocks: () => api.get('/auth/blocks'),
  setBlock: (id: string, blocked: boolean) => api.put(`/auth/blocks/${id}`, { blocked }),
};
