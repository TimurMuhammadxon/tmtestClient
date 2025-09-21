// app/page.tsx
import Navbar from "@/components/Home/NavbarHomePage";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="p-6">
        <h1 className="text-2xl font-bold">Добро пожаловать на TM test</h1>
        {/* Остальная часть страницы */}
      </main>
    </>
  );
}
