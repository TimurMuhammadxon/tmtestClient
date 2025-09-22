"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles, children }: React.PropsWithChildren<Props>) {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role || !allowedRoles.includes(role)) {
      router.push("/auth"); // перенаправляем на страницу логина
    }
  }, [router, allowedRoles]);

  return <>{children}</>;
}
