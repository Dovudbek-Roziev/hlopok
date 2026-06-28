// Buyurtma API / Order API calls
import api from './client';

export const ordersApi = {
  createOrder:      (data: any) => api.post('/orders', data),
  getMyOrders:      () => api.get('/orders/my'),
  getOrder:         (id: string) => api.get(`/orders/my/${id}`),
  cancelOrder:      (id: string, reason?: string) => api.put(`/orders/my/${id}/cancel`, { reason }),
  getPendingRatings: () => api.get('/orders/pending-ratings'),
};
