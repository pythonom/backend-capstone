import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('exam_portal_tokens') || '{}');
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 token expiration and refresh automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = JSON.parse(localStorage.getItem('exam_portal_tokens') || '{}');
        if (tokens?.refreshToken) {
          const res = await axios.post('/api/v1/auth/refresh-token', {
            refreshToken: tokens.refreshToken
          });
          const newAccessToken = res.data.data.accessToken;
          tokens.accessToken = newAccessToken;
          localStorage.setItem('exam_portal_tokens', JSON.stringify(tokens));

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('exam_portal_tokens');
        localStorage.removeItem('exam_portal_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
