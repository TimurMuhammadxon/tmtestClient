"use client";

import { useState, useRef, useEffect } from "react";
import { Phone, MessageCircle, ArrowLeft, ShieldCheck, ChevronRight, UserCircle2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "login" | "register";
type AuthMethod = "phone" | "google" | "telegram";

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
  const [isSuccess, setIsSuccess] = useState(false);

  // OTP inputs ref for modern 6-digit input
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const formatUzPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.substring(0, 12);
    return "+" + digits;
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (method === "phone") {
      setIdentifier(formatUzPhone(val));
    } else {
      setIdentifier(val);
    }
  };

  const switchMethod = (m: AuthMethod) => {
    setMethod(m);
    setStep(1);
    setIdentifier(m === "phone" ? "+998" : "");
    setSmsCode("");
    setOtpArray(["", "", "", "", "", ""]);
    setError("");
    setDebugOtp(null);
  };

  const redirectByRole = (role: string, fullname: string) => {
    if (fullname === "Новый Пользователь" || fullname === "New User") {
      window.location.href = "/completeprofile";
      return;
    }
    // All recognized roles now go to the unified dashboard
    const allowedRoles = ["owner", "superadmin", "admin", "instructor", "student"];
    if (allowedRoles.includes(role.toLowerCase())) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/app";
    }
  };

  const requestOtp = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier,
          method: method
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Ошибка при отправке кода");

      setDebugOtp(json.otp ?? null);
      setStep(2);
      // Focus first OTP input after transition
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (e: any) {
      setError(e.message || "Произошла непредвиденная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (codeToVerify: string) => {
    try {
      setIsLoading(true);
      setError("");

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier,
          code: codeToVerify,
          method: method,
          isRegister: mode === "register"
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Неверный код подтверждения");

      const userData = json.user;
      
      localStorage.setItem("token", json.token);
      localStorage.setItem("role", userData.role);
      localStorage.setItem("userId", userData.id);
      localStorage.setItem("name", userData.name || "Без имени");

      setIsSuccess(true);
      onSuccess?.(userData, json.token);

      setTimeout(() => redirectByRole(userData.role, userData.name), 800);
    } catch (e: any) {
      setError(e.message || "Ошибка верификации");
      setOtpArray(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpArray];
    
    // Paste logic
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasted[i];
      }
      setOtpArray(newOtp);
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (newOtp.join("").length === 6) {
        verifyOtp(newOtp.join(""));
      }
      return;
    }

    newOtp[index] = value;
    setOtpArray(newOtp);
    const code = newOtp.join("");

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (code.length === 6) {
      verifyOtp(code);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative my-10">
      <div className="relative bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl shadow-xl rounded-[2rem] p-8 sm:p-10 border border-white/40 dark:border-white/10 transition-all duration-500 overflow-hidden min-h-[500px] flex flex-col justify-center">
        
        {/* Success Overlay */}
        <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1, rotate: 360 }} 
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4"
            >
              <ShieldCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
            </motion.div>
            <h3 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Успешно!</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Перенаправление...</p>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Header */}
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-blue-500/30 transform transition-transform duration-300"
          >
            <UserCircle2 className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="font-heading text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {mode === "login" ? "С возвращением" : "Создать аккаунт"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm font-medium">
            {mode === "login" ? "Войдите в систему для продолжения" : "Присоединяйтесь к нашей платформе"}
          </p>
        </div>

        {/* Tabs for Methods */}
        <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-2 p-1.5 mb-8 bg-gray-100/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl ring-1 ring-black/5 dark:ring-white/10"
          >
            {(function(){ const arr: AuthMethod[] = ["phone", "google", "telegram"]; return arr; })().map((m) => {
              const Icon = m === "phone" ? Phone : m === "google" ? FcGoogle : MessageCircle;
              const isActive = method === m;
              return (
                <button
                  key={m}
                  onClick={() => switchMethod(m)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-md transform scale-[1.02]"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive && m !== "google" ? "animate-pulse" : ""}`} />
                  <span className="hidden sm:inline capitalize">
                    {m === "phone" ? "Телефон" : m === "google" ? "Google" : "Telegram"}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
        </AnimatePresence>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
          {/* Step 1 — Identifier Input */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-5"
            >
              {method === "google" ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { window.location.href = "/api/auth/google"; }}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 px-6 py-4 rounded-2xl font-semibold shadow-sm transition-all duration-300 group"
                  >
                    <FcGoogle className="w-6 h-6" />
                    <span>Продолжить с Google</span>
                  </motion.button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center leading-relaxed">
                    Вы будете перенаправлены на страницу авторизации Google.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300">
                      {method === "phone" ? (
                        <Phone className="w-5 h-5" />
                      ) : (
                        <MessageCircle className="w-5 h-5" />
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode={method === "phone" ? "tel" : "text"}
                      placeholder={
                        method === "phone"
                          ? "+998 90 123 45 67"
                          : "@username"
                      }
                      value={identifier}
                      onChange={handleIdentifierChange}
                      onFocus={() => {
                        if (method === "phone" && !identifier) setIdentifier("+998");
                        if (method === "telegram" && !identifier) setIdentifier("@");
                      }}
                      className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 font-medium text-base outline-none shadow-sm"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={requestOtp}
                    disabled={isLoading || !identifier || identifier === "+998" || identifier === "@"}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white px-6 py-4 rounded-2xl font-semibold shadow-xl shadow-gray-900/20 dark:shadow-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Получить код</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </motion.div>
          )}

          {/* Step 2 — OTP Input */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                  Изменить {method === "phone" ? "номер" : "никнейм"}
                </button>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  Шаг 2 из 2
                </span>
              </div>

              <div className="text-center space-y-2 mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Мы отправили код подтверждения на
                </p>
                <p className="font-bold text-gray-900 dark:text-white tracking-wide">
                  {identifier}
                </p>
              </div>

              <div className="flex justify-between gap-2 sm:gap-3">
                {otpArray.map((digit, index) => (
                  <motion.input
                    key={index}
                    whileFocus={{ scale: 1.05, y: -2 }}
                    initial={{ scale: 1 }}
                    animate={digit ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.2 }}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    disabled={isLoading}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-colors outline-none disabled:opacity-50 shadow-sm"
                  />
                ))}
              </div>

              {debugOtp && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 text-center"
                >
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    🛠 Тестовый код: <span className="font-bold text-lg ml-2 tracking-widest">{debugOtp}</span>
                  </p>
                </motion.div>
              )}

              {isLoading && (
                <div className="flex justify-center pt-2">
                  <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></span>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>

          <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-xl text-sm font-medium flex items-center gap-3 shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"></div>
              {error}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Bottom link toggle */}
      <div className="mt-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
        {mode === "login" ? (
          <p className="flex items-center justify-center gap-1.5">
            Нет аккаунта?{" "}
            <a href="/register" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-gray-200 dark:decoration-zinc-700 hover:decoration-blue-500 dark:hover:decoration-blue-400">
              Зарегистрироваться
            </a>
          </p>
        ) : (
          <p className="flex items-center justify-center gap-1.5">
            Уже есть аккаунт?{" "}
            <a href="/login" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-gray-200 dark:decoration-zinc-700 hover:decoration-blue-500 dark:hover:decoration-blue-400">
              Войти
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
