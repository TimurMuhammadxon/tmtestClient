"use client";

import { useState } from "react";

type AuthMode = "login" | "register";
type AuthMethod = "phone" | "email" | "telegram";

interface AuthFormProps {
  mode: AuthMode;
  onSuccess?: (user: any, token?: string) => void;
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const formatUzPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.substring(0, 12);
    let formatted = "+998";
    if (digits.length > 3) formatted += " " + digits.substring(3, 5);
    if (digits.length > 5) formatted += " " + digits.substring(5, 8);
    if (digits.length > 8) formatted += " " + digits.substring(8, 10);
    if (digits.length > 10) formatted += " " + digits.substring(10, 12);
    return formatted;
  };

  const handlePhoneOrTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(formatUzPhone(e.target.value));
  };

  const switchMethod = (m: AuthMethod) => {
    setMethod(m);
    setStep(1);
    setIdentifier("");
    setPassword("");
    setSmsCode("");
    setError("");
    setDebugOtp(null);
  };

  const redirectByRole = (role: string) => {
    switch (role) {
      case "owner":
        window.location.href = "/owner";
        break;
      case "superadmin":
        window.location.href = "/superadmin";
        break;
      case "admin":
        window.location.href = "/admin";
        break;
      case "teacher":
        window.location.href = "/teacher";
        break;
      case "student":
        window.location.href = "/student";
        break;
      case "parent":
        window.location.href = "/parent";
        break;
      default:
        window.location.href = "/dashboard";
        break;
    }
  };

  const handleSubmitStep1 = async () => {
    try {
      setError("");
      if (method === "phone" || method === "telegram") {
        const normalized = identifier.replace(/\D/g, "");
        if (normalized.length !== 12 || !normalized.startsWith("998")) {
          setError("Введите корректный номер (+998 XX XXX XX XX)");
          return;
        }
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: identifier }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json?.error || "Ошибка при отправке кода");
          return;
        }
        setDebugOtp(json.otp ?? null);
        setStep(2);
      } else if (method === "email") {
        if (!/\S+@\S+\.\S+/.test(identifier)) {
          setError("Введите корректный email");
          return;
        }
        if (!password) {
          setError("Введите пароль");
          return;
        }
        const route = mode === "login" ? "/api/auth/login-email" : "/api/auth/register-email";
        const res = await fetch(route, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier, password }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json?.error || "Ошибка");
          return;
        }
        // 🔹 Сохраняем token и role и имя
        localStorage.setItem("token", json.token);
        localStorage.setItem("role", json.user.role);
        localStorage.setItem("name", json.user.name || "Без имени"); // если есть имя
        onSuccess?.(json.user, json.token);

        // 🔹 Редирект по роли
        redirectByRole(json.user.role);
      }
    } catch (e: any) {
      setError(e.message || "Ошибка");
    }
  };

  const handleSubmitStep2 = async () => {
    try {
      setError("");
      if (!smsCode) {
        setError("Введите код подтверждения");
        return;
      }
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier, code: smsCode }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error || "Неверный код");
        return;
      }
      // 🔹 Сохраняем token и role и имя
      localStorage.setItem("token", json.token);
      localStorage.setItem("role", json.user.role);
      localStorage.setItem("name", json.user.name || "Без имени"); // если есть имя
      onSuccess?.(json.user, json.token);

      // 🔹 Редирект по роли
      redirectByRole(json.user.role);
    } catch (e: any) {
      setError(e.message || "Ошибка");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">{mode === "login" ? "Вход" : "Регистрация"}</h2>

      {/* tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => switchMethod("phone")} className={`px-3 py-1 rounded ${method === "phone" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>Телефон</button>
        <button onClick={() => switchMethod("email")} className={`px-3 py-1 rounded ${method === "email" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>Email</button>
        <button onClick={() => switchMethod("telegram")} className={`px-3 py-1 rounded ${method === "telegram" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>Telegram</button>
      </div>

      {/* step1 */}
      {step === 1 && (method === "phone" || method === "telegram") && (
        <div className="space-y-3 mb-4">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="+998 90 123 45 67"
            value={identifier}
            onChange={handlePhoneOrTelegramChange}
            onFocus={() => { if (!identifier) setIdentifier("+998 "); }}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      )}

      {step === 1 && method === "email" && (
        <div className="space-y-3 mb-4">
          <input type="email" placeholder="Email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>
      )}

      {/* step2 */}
      {step === 2 && (method === "phone" || method === "telegram") && (
        <div className="space-y-3 mb-4">
          <input type="text" placeholder="Код из SMS" value={smsCode} onChange={(e) => setSmsCode(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <button onClick={() => setStep(1)} className="text-sm text-gray-500 underline">← Назад</button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {debugOtp && <p className="text-sm text-gray-600 mb-2">Тестовый код: <b>{debugOtp}</b></p>}

      {step === 1 && <button onClick={handleSubmitStep1} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">{mode === "login" ? "Войти" : "Зарегистрироваться"}</button>}
      {step === 2 && <button onClick={handleSubmitStep2} className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Подтвердить код</button>}
    </div>
  );
}
