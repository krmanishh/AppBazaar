import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear from localStorage
      localStorage.removeItem('token')
      // Redirect to login or refresh token logic can be added here
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
}

// Apps API
export const appAPI = {
  getApps: (filters = {}) => api.get('/apps', { params: filters }),
  getFeaturedApps: () => api.get('/apps/featured'),
  getAppById: (appId) => api.get(`/apps/${appId}`),
  createApp: (appData) => api.post('/apps', appData),
  updateApp: (appId, appData) => api.put(`/apps/${appId}`, appData),
  deleteApp: (appId) => api.delete(`/apps/${appId}`),
  toggleWishlist: (appId) => api.post(`/apps/${appId}/wishlist`),
  purchaseApp: (appId) => api.post(`/apps/${appId}/purchase`),
  addReview: (appId, reviewData) => api.post(`/apps/${appId}/review`, reviewData),
  getUserApps: () => api.get('/apps/user/my-apps'),
}

// Users API
export const userAPI = {
  getWishlist: () => api.get('/users/wishlist'),
  getPurchases: () => api.get('/users/purchases'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  getMyApps: () => api.get('/users/my-apps'),
  getAppStats: () => api.get('/users/app-stats'),
  getActivity: (page = 1, limit = 20) => api.get('/users/activity', { params: { page, limit } }),
  checkHasPurchased: (appId) => api.get(`/users/has-purchased/${appId}`),
  checkInWishlist: (appId) => api.get(`/users/in-wishlist/${appId}`),
}

// Admin API
export const adminAPI = {
  // Users management
  getUsers: (filters = {}) => api.get('/admin/users', { params: filters }),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // Apps management
  getAllApps: (filters = {}) => api.get('/admin/apps', { params: filters }),
  updateAppStatus: (appId, statusData) => api.put(`/admin/apps/${appId}/status`, statusData),
  toggleAppFeatured: (appId) => api.put(`/admin/apps/${appId}/featured`),
  
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  getSystemHealth: () => api.get('/admin/health'),
}

// Health check
export const healthCheck = () => api.get('/health')

export default api
