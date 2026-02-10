// src/services/api.ts
import axios from 'axios';
import type { AuthResponse, TaskFormData, TasksResponse, TaskStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  signup: async (name: string, email: string, password: string) => {
    const response = await api.post<AuthResponse>('/api/auth/signup', {
      name,
      email,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Task API
export const taskAPI = {
  createTask: async (taskData: TaskFormData) => {
    const response = await api.post('/api/tasks', taskData);
    return response.data;
  },

  getAllTasks: async (params?: {
    author?: string;
    division?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<TasksResponse>('/api/tasks', { params });
    return response.data;
  },

  getTaskById: async (id: string) => {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
  },

  updateTask: async (id: string, taskData: Partial<TaskFormData>) => {
    const response = await api.put(`/api/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/api/tasks/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<{ success: boolean; stats: TaskStats }>('/api/tasks/stats');
    return response.data;
  },

  downloadExcel: async (params?: {
    author?: string;
    division?: string;
    status?: string;
    priority?: string;
  }) => {
    const response = await api.get('/api/tasks/download/excel', {
      params,
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tasks_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
