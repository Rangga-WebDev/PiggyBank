/** @format */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppLanguage = "en" | "id";
export type AppTheme = "light" | "dark";

type AppPreferencesValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const AppPreferencesContext = createContext<AppPreferencesValue | null>(null);

const LANG_KEY = "ai-piggybank-lang";
const THEME_KEY = "ai-piggybank-theme";

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    return;
  }
  root.classList.remove("dark");
}

export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [theme, setThemeState] = useState<AppTheme>("light");

  useEffect(() => {
    const storedLanguage = localStorage.getItem(LANG_KEY);
    const storedTheme = localStorage.getItem(THEME_KEY);

    if (storedLanguage === "en" || storedLanguage === "id") {
      setLanguageState(storedLanguage);
    }

    if (storedTheme === "light" || storedTheme === "dark") {
      setThemeState(storedTheme);
      applyTheme(storedTheme);
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const fallbackTheme: AppTheme = prefersDark ? "dark" : "light";
    setThemeState(fallbackTheme);
    applyTheme(fallbackTheme);
  }, []);

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(LANG_KEY, nextLanguage);
  };

  const setTheme = (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const value = useMemo(
    () => ({ language, setLanguage, theme, setTheme, toggleTheme }),
    [language, theme],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error(
      "useAppPreferences must be used within AppPreferencesProvider",
    );
  }
  return context;
}
