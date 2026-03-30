import axios from 'axios'

// ─── Axios Instance ─────────────────────────────────────────
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor: attach Bearer token ────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

// ─── Response Interceptor: auto-refresh on 401 ───────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry  = true
      isRefreshing     = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        processQueue(err)
        isRefreshing = false
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(err)
      }

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
        localStorage.setItem('accessToken',  data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
        processQueue(null, data.accessToken)
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

// ─── Typed API helpers ───────────────────────────────────────
export const authAPI = {
  register: (d)  => api.post('/auth/register', d),
  login:    (d)  => api.post('/auth/login', d),
  refresh:  (rt) => api.post('/auth/refresh', { refreshToken: rt }),
  logout:   ()   => api.post('/auth/logout'),
}

export const budgetsAPI = {
  list:   ()      => api.get('/budgets'),
  get:    (id)    => api.get(`/budgets/${id}`),
  create: (d)     => api.post('/budgets', d),
  delete: (id)    => api.delete(`/budgets/${id}`),
}

export const incomeAPI = {
  add:    (d)  => api.post('/income', d),
  update: (id, d) => api.patch(`/income/${id}`, d),
  delete: (id)    => api.delete(`/income/${id}`),
}

export const expensesAPI = {
  list:   (params) => api.get('/expenses', { params }),
  create: (d)      => api.post('/expenses', d),
  update: (id, d)  => api.patch(`/expenses/${id}`, d),
  delete: (id)     => api.delete(`/expenses/${id}`),
}

export const analyticsAPI = {
  summary: (budgetId) => api.get(`/analytics/summary/${budgetId}`),
  history: (params)   => api.get('/analytics/history', { params }),
  export:  (budgetId, fmt) => api.get(`/analytics/export/${budgetId}`, { params: { format: fmt }, responseType: 'blob' }),
}

export const usersAPI = {
  profile:       ()  => api.get('/users/profile'),
  updateProfile: (d) => api.patch('/users/profile', d),
}

export default api
