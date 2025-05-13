import axios from 'axios'
import { API_URL } from './config.js'

axios.defaults.withCredentials = true // ważne do obsługi cookie

// Prefetch CSRF token
const fetchCsrfToken = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
    axios.defaults.headers.common['X-CSRF-Token'] = res.data.csrfToken;
  } catch (err) {
    console.error('CSRF prefetch error', err);
  }
};

fetchCsrfToken();

// Interceptor
axios.interceptors.request.use(async config => {
  const method = config.method?.toLowerCase();
  const needsCsrf = ['post', 'put', 'delete', 'patch'].includes(method);

  if (needsCsrf && !axios.defaults.headers.common['X-CSRF-Token']) {
    try {
      const res = await axios.get(`${API_URL}/api/csrf-token`, { withCredentials: true });
      axios.defaults.headers.common['X-CSRF-Token'] = res.data.csrfToken;
    } catch (err) {
      console.error('CSRF fetch error:', err);
    }
  }

  return config;
}, error => Promise.reject(error));
