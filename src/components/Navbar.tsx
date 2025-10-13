"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { getRoleName } from "@/helpers/roleHelper";
import { logout } from "@/helpers/logout";

interface User {
  name?: string;
  role?: string;
}

const Navbar = () => {
  const [user, setUser] = useState<User>({ name: "", role: "" });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = localStorage.getItem("name") || "";
    const role = localStorage.getItem("role") || "";
    setUser({ name, role });
  }, []);

  // Автоматически закрывает меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Подтверждение выхода
  const handleLogout = () => {
    if (confirm("Вы действительно хотите выйти?")) {
      logout();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 relative">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>

      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full relative">
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image src="/announcement.png" alt="" width={20} height={20} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            1
          </div>
        </div>

        {/* USER SECTION */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="flex flex-col text-right">
              <span className="text-xs leading-3 font-medium">
                {user.name || "Без имени"}
              </span>
              <span className="text-[10px] text-gray-500 text-right">
                {getRoleName(user.role)}
              </span>
            </div>
            <Image
              src="/avatar.png"
              alt="User Avatar"
              width={36}
              height={36}
              className="rounded-full"
            />
          </div>

          {/* DROPDOWN MENU */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-xl p-2 z-50">
              <button
                className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100"
                onClick={() => alert("Профиль")}
              >
                👤 Профиль
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100"
                onClick={() => alert("Настройки")}
              >
                ⚙️ Настройки
              </button>
              <hr className="my-1" />
              <button
                onClick={handleLogout}   // 👈 вот здесь она используется
                className="block w-full text-left px-3 py-2 text-sm rounded text-red-500 hover:bg-red-100"
              >
                🚪 Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    
  );
};

export default Navbar;
