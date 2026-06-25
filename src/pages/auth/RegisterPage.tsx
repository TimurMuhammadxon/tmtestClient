import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";

type FormData = { email: string; password: string; confirmPassword: string };

export function RegisterPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();

  const schema = z
    .object({
      email: z.string().email(t.email),
      password: z.string().min(6, t.passwordMinLength),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t.passwordMismatch,
      path: ["confirmPassword"],
    });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await authApi.register(data.email, data.password);
      const res = await authApi.login(data.email, data.password);
      setTokens(res.accessToken, res.refreshToken);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { title?: string } } })?.response?.data?.title;
      setError(msg ?? t.error);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0,240,255,0.1)",
    color: "#e2e8f0",
  };

  const labelStyle = { color: "rgba(148, 163, 184, 0.8)", fontSize: "13px" };

  return (
    <div className="space-y-5">
      <div>
        <h2 style={{ color: "#e2e8f0", fontSize: "22px", fontWeight: 700, margin: 0 }}>
          {t.register}
        </h2>
        <p style={{ color: "rgba(148, 163, 184, 0.6)", fontSize: "13px", marginTop: "4px" }}>
          {t.enterAccount}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" style={labelStyle}>{t.email}</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            style={inputStyle}
            {...register("email")}
          />
          {errors.email && (
            <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" style={labelStyle}>{t.password}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              style={{ ...inputStyle, paddingRight: "2.5rem" }}
              {...register("password")}
            />
            <button
              type="button"
              style={{ color: "rgba(148, 163, 184, 0.5)" }}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-slate-300 transition-colors"
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" style={labelStyle}>{t.confirmPassword}</Label>
          <Input
            id="confirmPassword"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            style={inputStyle}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            padding: "10px 12px",
            color: "#f87171",
            fontSize: "13px",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: isSubmitting
              ? "rgba(124, 58, 237, 0.2)"
              : "linear-gradient(135deg, #7c3aed, #9f5cf1)",
            border: "none",
            borderRadius: "8px",
            color: isSubmitting ? "rgba(148, 163, 184, 0.6)" : "#ffffff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: isSubmitting ? "none" : "0 0 20px rgba(124, 58, 237, 0.3)",
            transition: "all 0.2s",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {!isSubmitting && <UserPlus style={{ width: "16px", height: "16px" }} />}
          {isSubmitting ? t.loadingText : t.register}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(148, 163, 184, 0.5)" }}>
        {t.haveAccount}{" "}
        <Link
          to="/login"
          style={{ color: "#00f0ff", fontWeight: 600, textDecoration: "none" }}
        >
          {t.login}
        </Link>
      </p>
    </div>
  );
}
