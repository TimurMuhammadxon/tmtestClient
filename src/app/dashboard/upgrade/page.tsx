"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Zap, GraduationCap, Users } from "lucide-react";

type Tab = "student" | "teacher";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("ru-RU").format(price);
};

const plans = {
  student: [
    { id: "s1", duration: "1 неделя", price: 20000, popular: false },
    { id: "s2", duration: "2 недели", price: 30000, popular: false },
    { id: "s3", duration: "1 месяц", price: 50000, popular: true },
    { id: "s4", duration: "3 месяца", price: 100000, popular: false },
  ],
  teacher: [
    { id: "t1", duration: "1 неделя", price: 40000, popular: false },
    { id: "t2", duration: "2 недели", price: 60000, popular: false },
    { id: "t3", duration: "1 месяц", price: 100000, popular: true },
    { id: "t4", duration: "3 месяца", price: 200000, popular: false },
  ]
};

const features = {
  student: [
    "Доступ ко всем темам ПДД",
    "Подготовка по официальным билетам",
    "Режим марафона на выживание",
    "Подробная аналитика успеваемости",
  ],
  teacher: [
    "Все функции студенческого тарифа",
    "Мониторинг привязанных учеников",
    "Генерация ссылок на тестирование",
    "Детальная статистика по группе",
  ]
};

export default function UpgradePage() {
  const [activeTab, setActiveTab] = useState<Tab>("student");

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-2 shadow-lg shadow-blue-500/30"
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="font-heading text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Выберите ваш тариф
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Получите полный доступ к платформе TM TEST и ускорьте процесс обучения.
          Без скрытых платежей.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl flex gap-2 w-full max-w-sm backdrop-blur-sm border border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("student")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 relative ${activeTab === "student" ? "text-blue-600 dark:text-blue-400 shadow-md bg-white dark:bg-zinc-800" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            <GraduationCap className="w-5 h-5 z-10 relative" />
            <span className="z-10 relative">Студентам</span>
          </button>
          <button
            onClick={() => setActiveTab("teacher")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 relative ${activeTab === "teacher" ? "text-indigo-600 dark:text-indigo-400 shadow-md bg-white dark:bg-zinc-800" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            <Users className="w-5 h-5 z-10 relative" />
            <span className="z-10 relative">Учителям</span>
          </button>
        </div>
      </div>

      {/* Pricing Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4, staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0"
        >
          {plans[activeTab].map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col bg-white dark:bg-zinc-950 rounded-3xl p-8 transition-all duration-300 ${plan.popular ? "border-2 border-blue-500 shadow-xl shadow-blue-500/10 scale-105 z-10" : "border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md"}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
                  Выбор пользователей
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-gray-500 dark:text-gray-400 font-semibold mb-2">
                  {plan.duration}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-4xl font-extrabold text-gray-900 dark:text-white">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    UZS
                  </span>
                </div>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {features[activeTab].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-300 leading-tight">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${plan.popular ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30" : "bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-900 dark:text-white"}`}
              >
                Выбрать тариф
              </button>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
