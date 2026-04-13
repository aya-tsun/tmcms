import client from './client';
import type {
  User, Material, MaterialListOut, Tag, Evaluation, CustomAxis, Memo, MaterialFilters,
} from '../types';

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ access_token: string; token_type: string; user: User }>('/auth/login', { email, password }),
  me: () => client.get<User>('/auth/me'),
};

// Materials
export const materialsApi = {
  list: (filters: MaterialFilters & { skip?: number; limit?: number }) =>
    client.get<MaterialListOut>('/materials', { params: filters }),
  get: (id: number) => client.get<Material>(`/materials/${id}`),
  create: (data: object) => client.post<Material>('/materials', data),
  update: (id: number, data: object) => client.put<Material>(`/materials/${id}`, data),
  delete: (id: number) => client.delete(`/materials/${id}`),
};

// Tags
export const tagsApi = {
  list: () => client.get<Tag[]>('/tags'),
  create: (name: string) => client.post<Tag>('/tags', { name }),
  delete: (id: number) => client.delete(`/tags/${id}`),
};

// Evaluations
export const evaluationsApi = {
  list: (materialId: number) => client.get<Evaluation[]>(`/materials/${materialId}/evaluations`),
  upsert: (materialId: number, data: object) =>
    client.post<Evaluation>(`/materials/${materialId}/evaluations`, data),
  delete: (materialId: number, evalId: number) =>
    client.delete(`/materials/${materialId}/evaluations/${evalId}`),
};

// Custom axes
export const axesApi = {
  list: () => client.get<CustomAxis[]>('/settings/axes'),
  create: (data: { name: string; order?: number }) => client.post<CustomAxis>('/settings/axes', data),
  delete: (id: number) => client.delete(`/settings/axes/${id}`),
};

// Memos
export const memosApi = {
  list: (materialId: number) => client.get<Memo[]>(`/materials/${materialId}/memos`),
  create: (materialId: number, content: string) =>
    client.post<Memo>(`/materials/${materialId}/memos`, { content }),
  update: (materialId: number, memoId: number, content: string) =>
    client.put<Memo>(`/materials/${materialId}/memos/${memoId}`, { content }),
  delete: (materialId: number, memoId: number) =>
    client.delete(`/materials/${materialId}/memos/${memoId}`),
};

// Users
export const usersApi = {
  list: () => client.get<User[]>('/users'),
  create: (data: object) => client.post<User>('/users', data),
  update: (id: number, data: object) => client.put<User>(`/users/${id}`, data),
  delete: (id: number) => client.delete(`/users/${id}`),
};

// Export
export const exportApi = {
  csv: (params: object) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return `/api/export/csv?${q}`;
  },
  xlsx: (params: object) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return `/api/export/xlsx?${q}`;
  },
  downloadCsv: (params: object) => {
    return client.get('/export/csv', {
      params,
      responseType: 'blob',
    });
  },
  downloadXlsx: (params: object) => {
    return client.get('/export/xlsx', {
      params,
      responseType: 'blob',
    });
  },
};
