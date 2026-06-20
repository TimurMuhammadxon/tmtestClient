import { create } from "zustand";

export type LangCode = "uz-latn" | "ru" | "uz-cyrl";

interface LanguageState {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
}

const STORAGE_KEY = "app-lang";

function getSavedLang(): LangCode {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "uz-latn" || saved === "ru" || saved === "uz-cyrl") return saved;
  return "uz-latn";
}

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: getSavedLang(),
  setLang: (lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
    set({ lang });
  },
}));
