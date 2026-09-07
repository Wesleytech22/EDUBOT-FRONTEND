import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edubot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sessão inválida/expirada (RF-21) — desloga e volta para /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('edubot_token');
      localStorage.removeItem('edubot_user');
      if (window.location.pathname !== '/login') {
        localStorage.setItem('edubot_logout_reason', 'expired');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
