"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setSessionExpiredHandler } from "@/services/api";
import { authService } from "@/services/auth.service";
import type { LoginPayload, RegisterPayload, User } from "@/types/auth";

export interface AuthContextValue {
  user: User | null;
  /** true while the initial session check is running */
  loading: boolean;
  login: (data: LoginPayload) => Promise<User>;
  register: (data: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first load using the refreshToken cookie.
  useEffect(() => {
    let active = true;
    authService
      .refresh()
      .then((res) => active && setUser(res.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Refresh failed on a later request -> drop the user; <ProtectedShell> redirects to /login.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (data: LoginPayload) => {
    const res = await authService.login(data);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterPayload) => {
    const res = await authService.register(data);
    return res.message; // user must verify email before logging in
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const res = await authService.googleStart();
    window.location.href = res.url; // backend callback sets cookies, then redirects to /dashboard
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, loginWithGoogle }),
    [user, loading, login, register, logout, loginWithGoogle],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
