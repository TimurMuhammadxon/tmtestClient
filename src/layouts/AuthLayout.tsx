import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { GraduationCap } from "lucide-react";

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "'Outfit', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient blobs */}
      <div style={{
        position: "absolute", top: "-15%", left: "-10%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0, 240, 255, 0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-15%",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124, 58, 237, 0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "40%", right: "20%",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245, 158, 11, 0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(0,240,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,240,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "64px", height: "64px", borderRadius: "16px",
            background: "linear-gradient(135deg, #00f0ff, #7c3aed)",
            boxShadow: "0 0 30px rgba(0, 240, 255, 0.3), 0 0 60px rgba(124, 58, 237, 0.2)",
            marginBottom: "1rem",
          }}>
            <GraduationCap style={{ width: "32px", height: "32px", color: "white" }} />
          </div>
          <h1 style={{
            fontSize: "20px", fontWeight: 700, color: "#e2e8f0",
            letterSpacing: "0.05em", margin: "0",
          }}>
            YO'L HARAKATI QOIDALARI
          </h1>
          <p style={{ color: "rgba(148, 163, 184, 0.6)", fontSize: "13px", marginTop: "4px" }}>
            Nazariy imtihonlarga tayyorgarlik tizimi
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(13, 13, 22, 0.8)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 240, 255, 0.1)",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(0, 240, 255, 0.05)",
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
