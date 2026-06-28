// Mahsulot API / Product API calls
import api from './client';

export const activePromosApi = {
  getActive: () => api.get('/promotions'),
};

export const productsApi = {
  getProducts:  (params?: any) => api.get('/products', { params }),
  getProduct:   (id: string) => api.get(`/products/${id}`),

  // Reviews
  getReviews:   (id: string) => api.get(`/products/${id}/reviews`),
  canReview:    (id: string) => api.get(`/products/${id}/reviews/can`),
  createReview: (id: string, data: { rating: number; comment: string }) =>
    api.post(`/products/${id}/reviews`, data),
  deleteReview: (productId: string, reviewId: string) =>
    api.delete(`/products/${productId}/reviews/${reviewId}`),
};
