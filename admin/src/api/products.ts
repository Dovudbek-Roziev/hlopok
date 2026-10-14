import api from './client';

export const fetchAllAdminProducts = async () => {
  const params = { limit: 500, isActive: 'all' };
  const first = await api.get('/products', { params: { ...params, page: 1 } });
  const products = [...first.data.products];
  const pages = first.data.pagination?.pages || 1;

  for (let page = 2; page <= pages; page += 1) {
    const response = await api.get('/products', { params: { ...params, page } });
    products.push(...response.data.products);
  }

  return products;
};
