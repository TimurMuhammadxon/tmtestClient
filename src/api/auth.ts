import { api } from "./axios";
import { type AuthResponse, type RegisterResponse } from "@/types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),

  register: (email: string, password: string) =>
    api.post<RegisterResponse>("/auth/register", { email, password }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post("/auth/logout", { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>("/auth/refresh", { refreshToken }).then((r) => r.data),

  telegramLogin: (initData: string) =>
    api.post<AuthResponse>("/auth/telegram", { initData }).then((r) => r.data),

  googleLogin: (idToken: string) =>
    api.post<AuthResponse>("/auth/google", { idToken }).then((r) => r.data),
};
