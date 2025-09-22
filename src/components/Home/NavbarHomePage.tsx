// components/Navbar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 shadow-sm bg-white">
      {/* Левая часть */}
      <div className="flex items-center gap-10">
        {/* Логотип */}
        <div className="flex items-center text-2xl font-bold">TM test</div>

        {/* Меню */}
        <div className="hidden md:flex gap-6 text-[15px] font-medium text-gray-800">
          <a href="#">Testlar</a>
          <a href="#">Olimpiadalar</a>
          <a href="#">Yangiliklar</a>
        </div>
      </div>

      {/* Правая часть */}
      <div className="flex items-center gap-4">
        {/* Уведомления */}
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image src="/announcement.png" alt="" width={20} height={20} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            1
          </div>
        </div>

        {/* Login / Register */}
        <Link
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-full text-sm font-medium"
        >
          Register
        </Link>
      </div>
    </nav>
  );
}
