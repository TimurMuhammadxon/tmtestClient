import { useEffect, useState, type ReactNode } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { router } from "@/router";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

const GOOGLE_CLIENT_ID = "1074843019354-g7erdamv4pr2r3mvcd1ko7v0m1cqh4b6.apps.googleusercontent.com";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        ready(): void;
        initDataUnsafe?: { start_param?: string };
      };
    };
  }
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function TelegramAutoLogin({ children }: { children: ReactNode }) {
  const setTokens = useAuthStore((s) => s.setTokens);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData;

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

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TelegramAutoLogin>
          <RouterProvider router={router} />
        </TelegramAutoLogin>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
