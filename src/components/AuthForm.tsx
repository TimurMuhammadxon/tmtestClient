"use client";

import { useState } from "react";
import { Mail, Phone, MessageCircle, ArrowLeft, ShieldCheck, KeyRound, ChevronRight } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);

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
    if (fullname === "New User") {
      window.location.href = "/completeprofile";
    } else {
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Проверка OTP
  const verifyOtp = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl p-8 border border-white/20 transition-all duration-300">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 mb-6 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {mode === "login" ? "С возвращением!" : "Создать аккаунт"}
          </h2>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            {mode === "login" ? "Войдите, чтобы продолжить" : "Присоединяйтесь к платформе"}
          </p>
        </div>

        {/* Tabs for Methods */}
        {step === 1 && (
          <div className="flex gap-2 p-1.5 mb-8 bg-gray-100/80 rounded-2xl">
            {(["phone", "email", "telegram"] as AuthMethod[]).map((m) => {
              const Icon = m === "phone" ? Phone : m === "email" ? Mail : MessageCircle;
              return (
                <button
                  key={m}
                  onClick={() => switchMethod(m)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    method === m
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {m === "phone" ? "Телефон" : m === "email" ? "Email" : "Telegram"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-6">
          {/* Step 1 — Identifier Input */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  {method === "phone" ? (
                    <Phone className="w-5 h-5" />
                  ) : method === "email" ? (
                    <Mail className="w-5 h-5" />
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                </div>
                <input
                  type={method === "email" ? "email" : "tel"}
                  inputMode={method === "email" ? "text" : "numeric"}
                  placeholder={
                    method === "email"
                      ? "Введите ваш email"
                      : method === "phone"
                      ? "+998 90 123 45 67"
                      : "Ваш Telegram номер"
                  }
                  value={identifier}
                  onChange={handleIdentifierChange}
                  onFocus={() => {
                    if ((method === "phone" || method === "telegram") && !identifier)
                      setIdentifier("+998");
                  }}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 font-medium text-base outline-none"
                />
              </div>

              <button
                onClick={requestOtp}
                disabled={isLoading || !identifier}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Получить код</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2 — OTP Input */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Назад к вводу {method === "email" ? "email" : "номера"}
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Код из SMS/Email"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 font-medium text-base outline-none tracking-widest text-center"
                  maxLength={6}
                />
              </div>

              {debugOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-amber-700 font-medium">
                    🛠 Тестовый код: <span className="font-bold text-lg ml-1">{debugOtp}</span>
                  </p>
                </div>
              )}

              <button
                onClick={verifyOtp}
                disabled={isLoading || !smsCode}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg shadow-green-500/25 transition-all duration-300 hover:shadow-green-500/40 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Подтвердить вход</span>
                    <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom link toggle */}
      <div className="mt-8 text-center text-sm font-medium text-gray-500">
        {mode === "login" ? (
          <p>
            Нет аккаунта?{" "}
            <a href="/register" className="text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors">
              Зарегистрироваться
            </a>
          </p>
        ) : (
          <p>
            Уже есть аккаунт?{" "}
            <a href="/login" className="text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors">
              Войти
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
