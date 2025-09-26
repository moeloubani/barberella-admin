import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://barberella-production.up.railway.app';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for appointments
export const appointmentsApi = {
  getAll: async () => {
    const response = await api.get('/appointments');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },

  getByDate: async (date: string) => {
    const response = await api.get(`/appointments/date/${date}`);
    return response.data;
  },
};

// API functions for customers
export const customersApi = {
  getAll: async () => {
    const response = await api.get('/customers');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get(`/customers/search?q=${query}`);
    return response.data;
  },
};

// API functions for analytics
export const analyticsApi = {
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getRevenue: async (period: 'daily' | 'weekly' | 'monthly', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ period });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/analytics/revenue?${params}`);
    return response.data;
  },

  getAppointmentStats: async () => {
    const response = await api.get('/analytics/appointments');
    return response.data;
  },
};

// API functions for call logs
export const callLogsApi = {
  getAll: async () => {
    const response = await api.get('/call-logs');
    return response.data;
  },

  getRecent: async (limit: number = 10) => {
    const response = await api.get(`/call-logs/recent?limit=${limit}`);
    return response.data;
  },
};