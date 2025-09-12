import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com',
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('evep_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('evep_token');
      localStorage.removeItem('evep_user');
      localStorage.removeItem('evep_email');
      localStorage.removeItem('evep_password');
      
      // Redirect to login page
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
