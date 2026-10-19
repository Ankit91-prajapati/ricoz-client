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
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.post<ApiResponse>("/auth/verify-email", { token }).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  // Reads the refreshToken cookie, re-issues both cookies and returns the user.
  // Used on app start to restore the session.
  refresh: () => api.post<AuthResponse>("/auth/refresh").then((r) => r.data),

  logout: () => api.post<ApiResponse>("/auth/logout").then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<ApiResponse>("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    api
      .post<ApiResponse>("/auth/reset-password", { token, newPassword })
      .then((r) => r.data),

  googleStart: () =>
    api.get<GoogleStartResponse>("/auth/google").then((r) => r.data),
};
