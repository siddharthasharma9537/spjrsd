import axios from 'axios';

// Falls back to a same-origin /api so a missing REACT_APP_BACKEND_URL yields a
// real 404 rather than the literal string "undefined/api", which the SPA
// fallback answers with index.html and a misleading 200.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API_URL = `${BACKEND_URL}/api`;

if (!process.env.REACT_APP_BACKEND_URL) {
  console.warn('REACT_APP_BACKEND_URL is not set; API calls will target same-origin /api.');
}

// Without this, a hung backend (down, crashed, still booting) leaves every
// "Please wait..." button stuck forever instead of failing into the page's
// existing error handling - that's what happened when the Render backend
// stopped responding: the login/register buttons spun for 90+ seconds with
// no way out.
const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    // A misrouted API call (bad base URL, backend down behind an SPA fallback)
    // returns index.html with a 200. Left alone, `res.data.slice(0, 5)` quietly
    // succeeds on that string and the page later dies on `.map is not a
    // function`. An HTML body here is an error, so surface it as one and let
    // the callers' existing .catch handlers keep their empty defaults.
    const contentType = res.headers?.['content-type'] || '';
    if (typeof res.data === 'string' && !contentType.includes('json')) {
      return Promise.reject(
        new Error(`Expected JSON from ${res.config?.url ?? 'API'} but received ${contentType || 'a non-JSON body'}`)
      );
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
    }
    return Promise.reject(err);
  }
);

export default api;
