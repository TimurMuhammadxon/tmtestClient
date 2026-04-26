"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  Link as LinkIcon,
  LogOut,
  Menu,
  Zap,
  PlusCircle
} from "lucide-react";

type Role = "owner" | "superadmin" | "admin" | "instructor" | "teacher" | "student" | null;

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    name: "Главная",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "superadmin", "admin", "instructor", "teacher", "student"],
  },
  {
    name: "Тесты и Экзамены",
    href: "/dashboard/tests",
    icon: BookOpen,
    roles: ["owner", "superadmin", "admin", "instructor", "teacher", "student"],
  },
  {
    name: "Управление пользователями",
    href: "/dashboard/users",
    icon: Users,
    roles: ["owner", "superadmin", "admin"],
  },
  {
    name: "Создать тест",
    href: "/dashboard/create-test",
    icon: PlusCircle,
    roles: ["owner", "superadmin", "admin"],
  },
  {
    name: "Мои ученики",
    href: "/dashboard/students",
    icon: Users,
    roles: ["instructor", "teacher"],
  },
  {
    name: "Ссылки на тесты",
    href: "/dashboard/links",
    icon: LinkIcon,
    roles: ["owner", "superadmin", "admin", "instructor", "teacher"],
  },
  {
    name: "Тарифы (Upgrade)",
    href: "/dashboard/upgrade",
    icon: Zap,
    roles: ["owner", "superadmin", "admin", "instructor", "teacher", "student"],
  },
  {
    name: "Статистика",
    href: "/dashboard/statistics",
    icon: BarChart3,
    roles: ["owner", "superadmin", "admin", "instructor", "teacher"],
  },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const [role, setRole] = useState<Role>(null);
  const pathname = usePathname();

  useEffect(() => {
    const storedRole = localStorage.getItem("role")?.toLowerCase() as Role;
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const filteredNavItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      className="h-screen bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-all duration-300 z-40 shrink-0"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-zinc-800">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="font-heading font-bold text-xl text-blue-600 dark:text-blue-400 overflow-hidden whitespace-nowrap"
          >
            TM TEST
          </motion.div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors mx-auto"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div 
                className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                {isOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-3 whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-6 h-6 shrink-0" />
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3 font-semibold whitespace-nowrap"
            >
              Выйти
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
