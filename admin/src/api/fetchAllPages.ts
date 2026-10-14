import api from './client';

export const fetchAllPages = async <T,>(path: string, collection: string, params: Record<string, unknown> = {}) => {
  const first = await api.get(path, { params: { ...params, page: 1, limit: 500 } });
  const result = [...(first.data[collection] as T[])];
  const pagination = first.data.pagination;
  const pages = pagination?.pages ?? Math.ceil((pagination?.total || result.length) / (pagination?.limit || 500));

  for (let page = 2; page <= pages; page += 1) {
    const response = await api.get(path, { params: { ...params, page, limit: 500 } });
    result.push(...(response.data[collection] as T[]));
  }

  return result;
};
