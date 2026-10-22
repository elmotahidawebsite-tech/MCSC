import axios from "axios";

const API_URL = "http://10.227.221.88:8000/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


// On a 401, try refreshing the access token once, then retry the request.
// If refresh also fails, drop the session and send the user back to login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
          localStorage.setItem("access", data.access);
          if (data.refresh) localStorage.setItem("refresh", data.refresh);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (refreshError: any) {
          // Network error: keep the session and tokens for later.
          if (!refreshError.response) {
            return Promise.reject(refreshError);
          }

          // Server rejected the refresh request.
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          window.location.href = "/login";

          return Promise.reject(refreshError);
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
