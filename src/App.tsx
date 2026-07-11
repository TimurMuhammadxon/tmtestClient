import { useEffect, useState, type ReactNode } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { router } from "@/router";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";
import { useLanguageStore } from "@/store/language";
import { ensureValidSession } from "@/lib/session";

const GOOGLE_CLIENT_ID = "1074843019354-g7erdamv4pr2r3mvcd1ko7v0m1cqh4b6.apps.googleusercontent.com";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        ready(): void;
        expand?(): void;
        requestFullscreen?(): void;
        platform?: string;
        initDataUnsafe?: { start_param?: string };
        onEvent?(event: string, cb: () => void): void;
        offEvent?(event: string, cb: () => void): void;
      };
    };
  }
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      // Resume is handled explicitly by SessionRevalidator (token first, then refetch),
      // so we disable the default focus storm that fired many requests before refresh.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// On return from background (an hour idle is fine), make sure the session is
// valid *before* any query refetches, then revalidate data. Never hangs:
// refresh is single-flight and falls back to Telegram initData re-login.
function SessionRevalidator() {
  useEffect(() => {
    let running = false;
    const revalidate = async () => {
      if (running) return;
      if (document.visibilityState !== "visible") return;
      if (!useAuthStore.getState().refreshToken && !window.Telegram?.WebApp?.initData) return;
      running = true;
      try {
        const token = await ensureValidSession();
        if (token) queryClient.invalidateQueries();
      } finally {
        running = false;
      }
    };

    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("focus", revalidate);
    const tg = window.Telegram?.WebApp;
    tg?.onEvent?.("activated", revalidate);

    return () => {
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("focus", revalidate);
      tg?.offEvent?.("activated", revalidate);
    };
  }, []);
  return null;
}

function TelegramAutoLogin({ children }: { children: ReactNode }) {
  const setTokens = useAuthStore((s) => s.setTokens);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData;

    // Enlarge the mini app: full height everywhere; on desktop clients request
    // fullscreen so it opens at a browser-like size instead of a narrow column.
    tg?.expand?.();
    const desktop =
      tg?.platform === "tdesktop" ||
      tg?.platform === "macos" ||
      tg?.platform === "web" ||
      tg?.platform === "weba";
    if (desktop) {
      try {
        tg?.requestFullscreen?.();
      } catch {
        /* older client without fullscreen support */
      }
    }

    if (!initData || isAuthenticated()) {
      tg?.ready();
      setReady(true);
      return;
    }

    authApi
      .telegramLogin(initData)
      .then((res) => setTokens(res.accessToken, res.refreshToken))
      .catch(() => {})
      .finally(() => {
        tg?.ready();
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "2px solid rgba(0,240,255,0.15)",
          borderTopColor: "#00f0ff",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}

function LanguageSync() {
  const lang = useLanguageStore((s) => s.lang);
  useEffect(() => {
    queryClient.invalidateQueries();
  }, [lang]);
  return null;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <LanguageSync />
        <SessionRevalidator />
        <TelegramAutoLogin>
          <RouterProvider router={router} />
        </TelegramAutoLogin>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
