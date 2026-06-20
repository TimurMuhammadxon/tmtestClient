import axios from "axios";
import { useAuthStore } from "@/store/auth";
import { useLanguageStore } from "@/store/language";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Accept-Language"] = useLanguageStore.getState().lang;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
            "/api/auth/refresh",
            { refreshToken }
          );
          setTokens(data.accessToken, data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          clearAuth();
        }
      } else {
        clearAuth();
      }
    }
    return Promise.reject(error);
  }
);
