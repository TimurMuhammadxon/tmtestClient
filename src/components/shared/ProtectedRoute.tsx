import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { ensureValidSession } from "@/lib/session";

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, hasRole } = useAuthStore();

  // A session is recoverable if the access token is still valid, or we hold a
  // refresh token / Telegram initData to silently mint a new one.
  const authed = isAuthenticated();
  const canRecover =
    authed ||
    !!useAuthStore.getState().refreshToken ||
    !!window.Telegram?.WebApp?.initData;

  // Expired access token but recoverable → refresh now instead of bouncing to /login.
  useEffect(() => {
    if (!authed && canRecover) void ensureValidSession();
  }, [authed, canRecover]);

  if (!canRecover) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
