import axios from 'axios';
import { Client, PullHistory, ClientFormData, PullEntryData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://client-management-system-dhyv0li33-birvas-projects-88a78539.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const clientsApi = {
  getAll: () => api.get<Client[]>('/clients'),
  getDetails: (id: number) => api.get<Client>(`/clients/${id}/details`),
  create: (data: ClientFormData) => api.post('/clients', data),
  update: (id: number, data: Partial<ClientFormData>) => api.put(`/clients/${id}`, data),
  delete: (id: number) => api.delete(`/clients/${id}`),
  getHistory: (id: number) => api.get<PullHistory[]>(`/clients/${id}/history`),
  addHistory: (id: number, data: PullEntryData) => 
    api.post(`/clients/${id}/history`, data),
};