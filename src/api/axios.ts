import axios from "axios";
import { useAuthStore } from "@/store/auth";
import { useLanguageStore } from "@/store/language";
import { refreshSession } from "@/lib/session";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
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
    if (!original) return Promise.reject(error);

    // 401 → recover session once (shared single-flight), then retry.
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const token = await refreshSession();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      return Promise.reject(error);
    }

    // Dead socket after WebView resume: timeout / network error with no response.
    // Retry idempotent GETs once so the UI never hangs on a stale connection.
    const isNetworkOrTimeout =
      error.code === "ECONNABORTED" || error.message === "Network Error" || !error.response;
    if (isNetworkOrTimeout && !original._netRetry && (original.method ?? "get").toLowerCase() === "get") {
      original._netRetry = true;
      return api(original);
    }

    return Promise.reject(error);
  }
);
