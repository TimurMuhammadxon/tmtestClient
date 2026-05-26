import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";
import { t } from "@/lib/i18n";
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "Elektron pochta kiritilishi kerak"),
  password: z.string().min(1, "Parol kiritilishi kerak"),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await authApi.login(data.email, data.password);
      setTokens(res.accessToken, res.refreshToken);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { title?: string } } })?.response?.data?.title;
      setError(msg ?? "Login yoki parol noto'g'ri");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 style={{ color: "#e2e8f0", fontSize: "22px", fontWeight: 700, margin: 0 }}>
          {t.login}
        </h2>
        <p style={{ color: "rgba(148, 163, 184, 0.6)", fontSize: "13px", marginTop: "4px" }}>
          Hisobingizga kiring
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" style={{ color: "rgba(148, 163, 184, 0.8)", fontSize: "13px" }}>
            {t.email}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(0,240,255,0.1)",
              color: "#e2e8f0",
            }}
            {...register("email")}
          />
          {errors.email && (
            <p style={{ color: "#f87171", fontSize: "12px" }}>{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" style={{ color: "rgba(148, 163, 184, 0.8)", fontSize: "13px" }}>
            {t.password}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(0,240,255,0.1)",
                color: "#e2e8f0",
                paddingRight: "2.5rem",
              }}
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
              ? "rgba(0, 240, 255, 0.2)"
              : "linear-gradient(135deg, #00f0ff, #0099ff)",
            border: "none",
            borderRadius: "8px",
            color: isSubmitting ? "rgba(148, 163, 184, 0.6)" : "#0a0a0f",
            fontWeight: 600,
            fontSize: "14px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: isSubmitting ? "none" : "0 0 20px rgba(0, 240, 255, 0.3)",
            transition: "all 0.2s",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {!isSubmitting && <LogIn style={{ width: "16px", height: "16px" }} />}
          {isSubmitting ? "Yuklanmoqda..." : t.login}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(148, 163, 184, 0.5)" }}>
        {t.noAccount}{" "}
        <Link
          to="/register"
          style={{ color: "#00f0ff", fontWeight: 600, textDecoration: "none" }}
        >
          {t.register}
        </Link>
      </p>
    </div>
  );
}
