export type Role = "user" | "admin";

export interface User {
  _id: string;
  username?: string;
  email: string;
  role: Role;
  isemailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse {
  success?: boolean;
  message: string;
}

export interface AuthResponse extends ApiResponse {
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleStartResponse extends ApiResponse {
  url: string;
}
