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

export default function HomePage() {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("O'zbekcha");

  const languages = ["O'zbekcha", "Ўзбекча", "Русский"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Car className="text-white w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800">
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
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden z-50">
                    {languages.map((l) => (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setLangOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                      >
                        {l}
                      </button>
                    ))}
                  </div>
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col items-center">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Подготовься к <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">экзаменам ПДД</span> с легкостью
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-medium mb-10">
            Изучайте правила дорожного движения, решайте тесты по билетам и готовьтесь к получению водительских прав в удобном формате.
          </p>
        </div>

        {/* Grid of Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-20">
          
          {/* Card 1 */}
          <div className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Мавзу бўйича тестлар</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              Тесты, разделенные по отдельным темам ПДД для глубокого изучения.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Ticket className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Билетлар</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              Классические экзаменационные билеты для комплексной проверки знаний.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sliders className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Созламали тестлар</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              Создайте свой собственный тест, выбрав только те вопросы, которые нужны.
            </p>
          </div>

          {/* Card 4 */}
          <div className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Timer className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Марафон режими</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              Пройдите все вопросы без остановки. Идеально для финального повторения.
            </p>
          </div>

          {/* Card 5 */}
          <div className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Барча тестлар жавоблари</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              Просматривайте правильные ответы ко всем тестам с подробными объяснениями.
            </p>
          </div>

          {/* Card 6 */}
          <div className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-100 group-hover:opacity-95 transition-opacity"></div>
            <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h3 className="relative z-10 text-xl font-bold text-white mb-3">Имтиҳон топшириш</h3>
            <p className="relative z-10 text-blue-100 font-medium text-sm leading-relaxed">
              Режим симуляции реального экзамена. Проверьте свою готовность прямо сейчас.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start items-center gap-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-tr from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                <Car className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-gray-900">TM Test</span>
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
