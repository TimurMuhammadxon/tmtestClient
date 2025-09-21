"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { usersData } from "@/lib/data"; // путь зависит от структуры

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSendOtp = () => {
    if (!phone.match(/^\+?\d{9,15}$/)) {
      setError("Telefon raqami noto‘g‘ri");
      return;
    }

    const user = usersData.find((u) => u.phone === phone);
    if (!user) {
      setError("Bunday foydalanuvchi topilmadi");
      return;
    }

    setError("");
    setStep("otp");
  };

  const handleVerifyOtp = () => {
    const user = usersData.find((u) => u.phone === phone);
    if (!user) {
      setError("Foydalanuvchi topilmadi");
      return;
    }

    if (otp === "123456") {
      // Успешный вход, перенаправляем
      const role = user.role.toLowerCase(); // "owner", "admin", "superadmin"
      onClose(); // Закрываем модал
      router.push(`/${role}`); // Переход на /owner или /admin
    } else {
      setError("Noto‘g‘ri kod");
    }
  };

  const closeAndReset = () => {
    setPhone("");
    setOtp("");
    setStep("phone");
    setError("");
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeAndReset}>
        {/* затемнённый фон */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm" />
        </Transition.Child>

        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-xl font-semibold">Kirish</Dialog.Title>
                <button onClick={closeAndReset} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>

              {step === "phone" && (
                <>
                  <input
                    type="tel"
                    placeholder="+998 ___ ___ __ __"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border p-2 rounded mb-4"
                  />
                  <button
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                    onClick={handleSendOtp}
                  >
                    Kodni yuborish
                  </button>
                </>
              )}

              {step === "otp" && (
                <>
                  <input
                    type="text"
                    placeholder="OTP kod"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full border p-2 rounded mb-4"
                  />
                  <button
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    onClick={handleVerifyOtp}
                  >
                    Tasdiqlash
                  </button>
                </>
              )}

              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}