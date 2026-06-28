// Auth API / Authentication API calls
import api from './client';

export const authApi = {
  sendOTP:              (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOTP:            (phone: string, code: string) => api.post('/auth/verify-otp', { phone, code }),
  register:             (data: any) => api.post('/auth/register', data),
  loginByPhone:         (phone: string, password: string) => api.post('/auth/login', { phone, password }),
  getMe:          () => api.get('/auth/me'),
  updateProfile:  (data: any) => api.put('/auth/profile', data),
  uploadAvatar:   (formData: FormData) => api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: [(data: any) => data],
  }),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { oldPassword, newPassword }),
  getFavorites:   () => api.get('/auth/favorites'),
  toggleFavorite: (productId: string) => api.post(`/auth/favorites/${productId}`),
  addAddress:     (data: any) => api.post('/auth/addresses', data),
  deleteAddress:  (addressId: string) => api.delete(`/auth/addresses/${addressId}`),
  savePushToken:  (token: string) => api.put('/auth/push-token', { token }),
};
