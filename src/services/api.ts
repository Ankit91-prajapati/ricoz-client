import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // send / receive the httpOnly auth cookies
  headers: { "Content-Type": "application/json" },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Registered by <AuthProvider> so the interceptor can tell the app the session is gone.
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

// One shared refresh request, so parallel 401s don't trigger parallel refreshes.
let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthCall = original?.url?.startsWith("/auth/");

    // Access token expired -> refresh once, then replay the original request.
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshPromise ??= api.post("/auth/refresh").finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
        return api(original);
      } catch (refreshError) {
        onSessionExpired?.(); // AuthProvider clears the user -> guard redirects to /login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
