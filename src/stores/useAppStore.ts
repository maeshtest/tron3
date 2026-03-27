import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  currency: "usd" | "inr";
  language: string;
  darkMode: boolean;
  setCurrency: (c: "usd" | "inr") => void;
  setLanguage: (l: string) => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currency: "usd",
      language: "en",
      darkMode: true,
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => {
        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = language;
        set({ language });
      },
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          if (next) document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
          return { darkMode: next };
        }),
    }),
    {
      name: "tronnlix-app-store",
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        document.documentElement.dir = state?.language === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = state?.language || "en";
      },
    }
  )
);
