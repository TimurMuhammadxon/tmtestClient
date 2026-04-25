"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Ticket, 
  Sliders, 
  Timer, 
  CheckSquare, 
  GraduationCap, 
  Globe, 
  ChevronDown,
  Car
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: BookOpen,
    title: "Мавзу бўйича тестлар",
    description: "Тесты, разделенные по отдельным темам ПДД для глубокого изучения.",
    colors: "from-blue-400 to-blue-600",
    shadow: "hover:shadow-blue-500/20",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Ticket,
    title: "Билетлар",
    description: "Классические экзаменационные билеты для комплексной проверки знаний.",
    colors: "from-indigo-400 to-indigo-600",
    shadow: "hover:shadow-indigo-500/20",
    bg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    icon: Sliders,
    title: "Созламали тестлар",
    description: "Создайте свой собственный тест, выбрав только те вопросы, которые нужны.",
    colors: "from-purple-400 to-purple-600",
    shadow: "hover:shadow-purple-500/20",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: Timer,
    title: "Марафон режими",
    description: "Пройдите все вопросы без остановки. Идеально для финального повторения.",
    colors: "from-orange-400 to-orange-600",
    shadow: "hover:shadow-orange-500/20",
    bg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    icon: CheckSquare,
    title: "Барча тестлар жавоблари",
    description: "Просматривайте правильные ответы ко всем тестам с подробными объяснениями.",
    colors: "from-emerald-400 to-emerald-600",
    shadow: "hover:shadow-emerald-500/20",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: GraduationCap,
    title: "Имтиҳон топшириш",
    description: "Режим симуляции реального экзамена. Проверьте свою готовность прямо сейчас.",
    colors: "from-blue-600 to-indigo-700",
    shadow: "hover:shadow-blue-500/30",
    bg: "bg-white/20 backdrop-blur-md",
    iconColor: "text-white",
    isPrimary: true,
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function HomePage() {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("O'zbekcha");

  const languages = ["O'zbekcha", "Ўзбекча", "Русский"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-32 left-1/2 w-[500px] h-[500px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 border-b border-gray-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Car className="text-white w-6 h-6" />
              </div>
              <span className="font-heading font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800">
                TM Test
              </span>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Language Selector */}
              <div className="relative">
                <button 
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors bg-white/50 rounded-lg hover:bg-gray-100"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${langOpen ? "rotate-180" : ""}`} />
                </button>
                
                {langOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden z-50"
                  >
                    {languages.map((l) => (
                      <button
                         key={l}
                         onClick={() => { setLang(l); setLangOpen(false); }}
                         className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                      >
                        {l}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Link 
                  href="/login"
                  className="hidden sm:flex items-center justify-center px-5 py-2.5 text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Вход
                </Link>
                <Link 
                  href="/register"
                  className="flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5"
                >
                  Регистрация
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col items-center relative z-10">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Подготовься к <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x">экзаменам ПДД</span> с легкостью
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            Изучайте правила дорожного движения, решайте тесты по билетам и готовьтесь к получению водительских прав в удобном формате.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all hover:scale-105 shadow-xl shadow-gray-900/20">
              Начать бесплатно
            </Link>
            <Link href="#features" className="px-8 py-4 bg-white/50 backdrop-blur-md text-gray-900 border border-gray-200 rounded-2xl font-bold text-lg hover:bg-white hover:scale-105 transition-all shadow-sm">
              Узнать больше
            </Link>
          </div>
        </motion.div>

        {/* Grid of Options */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          id="features"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full mb-20"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className={`group relative rounded-3xl p-8 border shadow-sm transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden ${feature.isPrimary ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent hover:shadow-blue-500/30' : 'bg-white/80 backdrop-blur-sm border-gray-100 hover:shadow-2xl ' + feature.shadow}`}
              >
                {!feature.isPrimary && (
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.colors} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                )}
                
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${feature.bg}`}>
                  <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                
                <h3 className={`font-heading text-xl font-bold mb-3 ${feature.isPrimary ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                
                <p className={`font-medium text-sm leading-relaxed ${feature.isPrimary ? 'text-blue-100' : 'text-gray-500'}`}>
                  {feature.description}
                </p>

                {/* Subtle glow effect behind card on hover */}
                {!feature.isPrimary && (
                   <div className={`absolute inset-0 bg-gradient-to-br ${feature.colors} opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none`}></div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start items-center gap-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-tr from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                <Car className="text-white w-5 h-5" />
              </div>
              <span className="font-heading font-bold text-xl text-gray-900">TM Test</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">О нас</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Контакты</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Условия использования</a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-8 flex items-center justify-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} TM Test. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
