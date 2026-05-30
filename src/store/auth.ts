import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AuthUser } from "@/types";
import { decodeJwt } from "@/lib/jwt";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  hasRole: (...roles: string[]) => boolean;
}

function parseUser(token: string): AuthUser | null {
  const payload = decodeJwt(token);
  if (!payload) return null;
  return {
    id: payload.sub,
    email: payload.email,
    role: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as AuthUser["role"],
    firstName: payload.given_name,
    lastName: payload.family_name,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setTokens: (accessToken, refreshToken) => {
        const user = parseUser(accessToken);
        set({ accessToken, refreshToken, user });
      },

      clearAuth: () => set({ accessToken: null, refreshToken: null, user: null }),

      isAuthenticated: () => {
        const { accessToken } = get();
        if (!accessToken) return false;
        const payload = decodeJwt(accessToken);
        if (!payload) return false;
        return payload.exp * 1000 > Date.now();
      },

      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
