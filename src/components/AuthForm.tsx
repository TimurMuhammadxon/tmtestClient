"use client";

import { useState } from "react";
import UserForm from "./UserForm";

type AuthMode = "login" | "register";
type AuthMethod = "phone" | "email" | "telegram";

interface AuthFormProps {
  mode: AuthMode;
  onSuccess?: (user: any, token?: string) => void;
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [identifier, setIdentifier] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

   // ✅ Новый форматтер номера без пробелов
  const formatUzPhone = (value: string) => {
    let digits = value.replace(/\D/g, ""); // оставляем только цифры
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.substring(0, 12); // ограничиваем длину
    return "+" + digits; // возвращаем +998XXXXXXXXX
  };

  // ✅ Обработчик изменения инпута
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (method === "phone" || method === "telegram") {
      setIdentifier(formatUzPhone(val));
    } else {
      setIdentifier(val);
    }
  };

  const switchMethod = (m: AuthMethod) => {
    setMethod(m);
    setStep(1);
    setIdentifier("");
    setSmsCode("");
    setError("");
    setDebugOtp(null);
  };

  const redirectByRole = (role: number, fullname: string) => {
    if(fullname === "New User")
    {
      window.location.href = "/completeprofile";
    }
    else
    {
      switch (role) {
      case 0:
        window.location.href = "/owner";
        break;
      case 1:
        window.location.href = "/superadmin";
        break;
      case 2:
        window.location.href = "/admin";
        break;
      case 3:
        window.location.href = "/teacher";
        break;
      case 4:
        window.location.href = "/student";
        break;
      case 5:
        window.location.href = "/parent";
        break;
      default:
        window.location.href = "app";
        break;
    }
    }

    
  };

  const getChannel = () => {
    switch (method) {
      case "email":
        return 0;
      case "phone":
        return 1;
      case "telegram":
        return 2;
      default:
        return 0;
    }
  };

  // ✅ Запрос OTP
  const requestOtp = async () => {
    try {
      setError("");
      const route = `${API_URL}/api/Auth/${mode}/request-otp`;

      const body = {
        Email: method === "email" ? identifier.trim() : "",
        Phone: method === "phone" ? identifier.replace(/\s/g, "") : "",
        Telegram: method === "telegram" ? identifier.replace(/\s/g, "") : "",
        Channel: getChannel(),
      };

      const res = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Ошибка подключения к серверу API");
      }

      if (!res.ok) throw new Error(json?.error || "Ошибка при отправке кода");

      setDebugOtp(json.otp ?? null);
      setStep(2);
    } catch (e: any) {
      setError(e.message || "Ошибка");
    }
  };

  // ✅ Проверка OTP
  const verifyOtp = async () => {
    try {
      setError("");
      if (!smsCode) {
        setError("Введите код подтверждения");
        return;
      }

      const route = `${API_URL}/api/Auth/${mode}/verify-otp`;

      const body = {
        OtpCode: smsCode.trim(),
        Channel: getChannel(),
      };

      const res = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Ошибка ответа от сервера");
      }

     // ✅ Извлекаем объект Data
    const userData = json.Data;

    // ✅ Сохраняем в localStorage
    localStorage.setItem("token", userData.Token);
    localStorage.setItem("role", userData.Role.toString());
    localStorage.setItem("userId", userData.UserId);
    localStorage.setItem("name", userData.FullName || "Без имени");

    // ✅ Колбэк для родителя (если есть)
    onSuccess?.(userData, userData.Token);

    // ✅ Переход по роли
    redirectByRole(userData.Role, userData.FullName);
    } catch (e: any) {
      setError(e.message || "Ошибка");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {mode === "login" ? "Вход" : "Регистрация"}
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["phone", "email", "telegram"] as AuthMethod[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMethod(m)}
            className={`px-3 py-1 rounded ${
              method === m ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {m === "phone" ? "Телефон" : m === "email" ? "Email" : "Telegram"}
          </button>
        ))}
      </div>

      {/* Step 1 — ввод */}
      {step === 1 && (
        <div className="space-y-3 mb-4">
          <input
            type={method === "email" ? "email" : "tel"}
            inputMode={method === "email" ? "text" : "numeric"}
            placeholder={
              method === "email"
                ? "Введите email"
                : method === "phone"
                ? "+998901234567"
                : "Номер Telegram"
            }
            value={identifier}
            onChange={handleIdentifierChange}
            onFocus={() => {
              if ((method === "phone" || method === "telegram") && !identifier)
                setIdentifier("+998");
            }}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      )}

      {/* Step 2 — код */}
      {step === 2 && (
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Код подтверждения"
            value={smsCode}
            onChange={(e) => setSmsCode(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <button
            onClick={() => setStep(1)}
            className="text-sm text-gray-500 underline"
          >
            ← Назад
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {debugOtp && (
        <p className="text-sm text-gray-600 mb-2">
          Тестовый код: <b>{debugOtp}</b>
        </p>
      )}

      {step === 1 && (
        <button
          onClick={requestOtp}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Отправить код
        </button>
      )}

      {step === 2 && (
        <button
          onClick={verifyOtp}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Подтвердить код
        </button>
      )}
    </div>
  );
}
