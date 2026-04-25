"use client";

import { useState, useEffect } from "react";
import { Bell, UserCircle } from "lucide-react";
import { getRoleName } from "@/helpers/roleHelper";

export default function Header() {
  const [name, setName] = useState("Пользователь");
  const [role, setRole] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("name");
    const storedRoleRaw = localStorage.getItem("role");
    
    if (storedName) setName(storedName);
    if (storedRoleRaw) {
       // Map the raw role string back to our unified format if needed, 
       // for now we just capitalize it or use a helper.
       setRole(storedRoleRaw.charAt(0).toUpperCase() + storedRoleRaw.slice(1));
    }
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="font-heading font-semibold text-lg text-gray-900 dark:text-white hidden sm:block">
          Добро пожаловать, {name}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-zinc-800">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{name}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {role || "Student"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <UserCircle className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
