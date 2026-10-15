// Mahsulot API / Product API calls
import api from './client';

export const activePromosApi = {
  getActive: () => api.get('/promotions'),
};

export const productsApi = {
  getProducts:  (params?: any) => api.get('/products', { params }),
  getProduct:   (id: string) => api.get(`/products/${id}`),

  // Reviews
  getReviews:   (id: string, page = 1) => api.get(`/products/${id}/reviews`, { params: { page } }),
  canReview:    (id: string) => api.get(`/products/${id}/reviews/can`),
  createReview: (id: string, data: { rating: number; comment: string; acceptRules: boolean }) =>
    api.post(`/products/${id}/reviews`, data),
  reportReview: (productId: string, reviewId: string) => api.post(`/products/${productId}/reviews/${reviewId}/report`, {}),
  deleteReview: (productId: string, reviewId: string) =>
    api.delete(`/products/${productId}/reviews/${reviewId}`),
};
