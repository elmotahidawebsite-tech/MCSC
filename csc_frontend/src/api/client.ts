
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
});

// Track whether a request has already been retried.
interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Share one refresh request between all concurrent 401 responses.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refresh = localStorage.getItem("refresh");

    if (!refresh) {
      return Promise.reject(new Error("No refresh token available"));
    }

    refreshPromise = axios
      .post(`${API_URL}/auth/refresh/`, { refresh })
      .then(({ data }) => {
        localStorage.setItem("access", data.access);

        if (data.refresh) {
          localStorage.setItem("refresh", data.refresh);
        }

        return data.access as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Attach the current access token to each request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle expired access tokens and permission errors.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequest | undefined;

    // Handle 403 Forbidden - Permission denied
    // Do NOT attempt token refresh on 403
    if (error.response?.status === 403) {
      // Redirect to unauthorized page
      // Use setTimeout to avoid potential redirect loops during initial page load
      setTimeout(() => {
        if (window.location.pathname !== '/unauthorized' && 
            window.location.pathname !== '/login') {
          window.location.href = '/unauthorized';
        }
      }, 100);
      
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      original.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(original);
    } catch (refreshError) {
      // Keep the session if the failure is a network error.
      if (
        axios.isAxiosError(refreshError) &&
        !refreshError.response
      ) {
        return Promise.reject(refreshError);
      }

      // The server rejected the refresh token.
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      window.location.href = "/login";

      return Promise.reject(refreshError);
    }
  }
);
