import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { BookOpen } from "lucide-react";

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">YO'L HARAKATI QOIDALARI</h1>
          <p className="text-muted-foreground text-sm mt-1">Nazariy imtihonlarga tayyorgarlik tizimi</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
