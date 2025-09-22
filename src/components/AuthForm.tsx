"use client";

import { useState } from "react";

type AuthMode = "login" | "register";
type AuthMethod = "phone" | "email" | "telegram";

interface AuthFormProps {
  mode: AuthMode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  // Формат номера
  const formatUzPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (!digits.startsWith("998")) {
      digits = "998" + digits;
    }
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

  const handleSubmitStep1 = () => {
    if (method === "phone" || method === "telegram") {
      if (identifier.replace(/\D/g, "").length !== 12) {
        setError("Введите корректный номер (+998 XX XXX XX XX)");
        return;
      }
      setError("");
      console.log(`Отправляем код (${method}):`, identifier);
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
      setError("");
      console.log("Email вход:", identifier, password);
    }
  };

  const handleSubmitStep2 = () => {
    if (!smsCode) {
      setError("Введите код подтверждения");
      return;
    }
    setError("");
    console.log(`Подтверждаем код для ${method}:`, smsCode);
  };

  // Функция для переключения вкладок
  const switchMethod = (newMethod: AuthMethod) => {
    setMethod(newMethod);
    setStep(1);
    setIdentifier("");
    setPassword("");
    setSmsCode("");
    setError(""); // ✅ очищаем ошибку при смене метода
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {mode === "login" ? "Вход" : "Регистрация"}
      </h2>

      {/* Вкладки */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => switchMethod("phone")}
          className={`px-3 py-1 rounded ${
            method === "phone" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Телефон
        </button>
        <button
          onClick={() => switchMethod("email")}
          className={`px-3 py-1 rounded ${
            method === "email" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Email
        </button>
        <button
          onClick={() => switchMethod("telegram")}
          className={`px-3 py-1 rounded ${
            method === "telegram" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Telegram
        </button>
      </div>

      {/* Этап 1 */}
      {step === 1 && (method === "phone" || method === "telegram") && (
        <div className="space-y-3 mb-4">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="+998 90 123 45 67"
            value={identifier}
            onChange={handlePhoneOrTelegramChange}
            onFocus={() => {
              if (!identifier) setIdentifier("+998 ");
            }}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      )}

      {step === 1 && method === "email" && (
        <div className="space-y-3 mb-4">
          <input
            type="email"
            placeholder="Введите email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      )}

      {/* Этап 2 */}
      {step === 2 && (method === "phone" || method === "telegram") && (
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Введите код подтверждения"
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

      {/* Кнопки */}
      {step === 1 && (
        <button
          onClick={handleSubmitStep1}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>
      )}

      {step === 2 && (
        <button
          onClick={handleSubmitStep2}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Подтвердить код
        </button>
      )}
    </div>
  );
}
