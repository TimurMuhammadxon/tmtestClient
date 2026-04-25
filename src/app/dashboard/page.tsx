"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  TrendingUp,
  CheckCircle2,
  Clock
} from "lucide-react";

type Role = "owner" | "superadmin" | "admin" | "instructor" | "student" | null;

export default function DashboardPage() {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role")?.toLowerCase() as Role;
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  // Dummy stats based on roles for demonstration
  const getStats = () => {
    if (role === "student") {
      return [
        { label: "Пройдено тестов", value: "12", icon: BookOpen, color: "blue" },
        { label: "Средний балл", value: "85%", icon: TrendingUp, color: "green" },
        { label: "Осталось билетов", value: "8", icon: Clock, color: "orange" },
      ];
    }
    if (role === "instructor") {
      return [
        { label: "Мои ученики", value: "45", icon: Users, color: "blue" },
        { label: "Активные тесты", value: "3", icon: CheckCircle2, color: "green" },
        { label: "Средний балл группы", value: "78%", icon: BarChart3, color: "purple" },
      ];
    }
    // Admin / SuperAdmin / Owner stats
    return [
      { label: "Всего пользователей", value: "1,248", icon: Users, color: "blue" },
      { label: "Активных тестов", value: "156", icon: BookOpen, color: "indigo" },
      { label: "Успеваемость", value: "82%", icon: TrendingUp, color: "green" },
    ];
  };

  if (!role) return <div className="flex items-center justify-center h-64"><span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span></div>;

  const stats = getStats();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
          Сводка
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Обзор вашей активности и ключевых показателей.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {stat.label}
                </p>
                <h3 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm mt-8"
      >
        <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-4">
          Последняя активность
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Здесь будет отображаться ваша недавняя активность в системе.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
