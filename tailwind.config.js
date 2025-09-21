/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',    // Включаем все файлы в папке app
    './src/components/**/*.{js,ts,jsx,tsx}', // Включаем все компоненты в папке components
    './src/pages/**/*.{js,ts,jsx,tsx}',    // Включаем страницы
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
