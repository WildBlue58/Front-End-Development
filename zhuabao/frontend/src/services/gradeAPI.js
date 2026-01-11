import axios from 'axios';

const api = axios.create({
  baseURL: '/api/grades',
  timeout: 120000,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      '请求失败';
    return Promise.reject(new Error(message));
  }
);

export const gradeAPI = {
  extractGrades: () => api.get('/extract'),

  refreshGrades: () => api.get('/refresh'),

  getCurrentGrades: () => api.get('/current'),

  exportToExcel: () => {
    window.location.href = '/api/grades/export/excel';
    return Promise.resolve({ success: true });
  },

  exportToCSV: () => {
    window.location.href = '/api/grades/export/csv';
    return Promise.resolve({ success: true });
  },

  getStatus: () => api.get('/status'),

  closeBrowser: () => api.post('/close'),
};

export default api;
