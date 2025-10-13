"use client";

export const logout = () => {
  // Удаляем сохранённые данные пользователя
  localStorage.removeItem("token");
  localStorage.removeItem("name");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("phone");

  // Перенаправляем на страницу входа
  window.location.href = "/login";
};