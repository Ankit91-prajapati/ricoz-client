
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(
  handler: (() => void) | null,
) {
  onSessionExpired = handler;
}

let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const url = original?.url ?? "";

    // Match auth endpoints whether the URL starts with "/" or not.
    const isAuthCall = /\/api\/auth(?:\/|$)/.test(url);

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthCall
    ) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post("/api/auth/refresh")
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;

        // Retry the original request once.
        return api(original);
      } catch (refreshError) {
        onSessionExpired?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
