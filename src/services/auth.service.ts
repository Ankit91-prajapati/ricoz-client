import { api } from "./api";
import type {
  ApiResponse,
  AuthResponse,
  GoogleStartResponse,
  LoginPayload,
  RegisterPayload,
} from "@/types/auth";

export const authService = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("api/auth/register", data).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.post<ApiResponse>("api/auth/verify-email", { token }).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>("api/auth/login", data).then((r) => r.data),

  // Reads the refreshToken cookie, re-issues both cookies and returns the user.
  // Used on app start to restore the session.
  refresh: () => api.post<AuthResponse>("api/auth/refresh").then((r) => r.data),

  logout: () => api.post<ApiResponse>("api/auth/logout").then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<ApiResponse>("api/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    api
      .post<ApiResponse>("api/auth/reset-password", { token, newPassword })
      .then((r) => r.data),

  googleStart: () =>
    api.get<GoogleStartResponse>("api/auth/google").then((r) => r.data),
};
