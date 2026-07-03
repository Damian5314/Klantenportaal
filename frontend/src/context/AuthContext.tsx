import * as React from "react";
import { api, clearTokens, getAccessToken, setTokens } from "@/api/client";
import type { CurrentUser } from "@/types";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadUser = React.useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get<CurrentUser>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = React.useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    setTokens(data.accessToken, data.refreshToken);
    setUser({
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      avatarUrl: data.user.avatarUrl,
      kind: data.user.kind,
      roleName: data.user.roleName,
      permissions: data.user.permissions,
    });
  }, []);

  const logout = React.useCallback(async () => {
    const refreshToken = localStorage.getItem("kp_refresh_token");
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const hasPermission = React.useCallback((permission: string) => !!user?.permissions.includes(permission), [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, refetchUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
