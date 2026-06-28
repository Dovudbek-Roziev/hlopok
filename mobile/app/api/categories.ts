// Kategoriya + Banner + Brand + Promotion API
import api from './client';

export const categoriesApi = {
  getCategories: () => api.get('/categories'),
};

export const bannersApi = {
  getBanners: (type?: string) => api.get('/banners', { params: type ? { type } : {} }),
};

export const brandsApi = {
  getBrands: () => api.get('/brands'),
};

export const promotionsApi = {
  getPromotions: () => api.get('/promotions'),
  getPromotion:  (id: string) => api.get(`/promotions/${id}`),
};

export const bonusApi = {
  getMyHistory:  () => api.get('/bonus/my'),
  getSettings:   () => api.get('/bonus/settings'),
};

export const storeSettingsApi = {
  getSettings: () => api.get('/store-settings'),
};
