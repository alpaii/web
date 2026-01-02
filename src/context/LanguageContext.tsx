"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ko" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ko");
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "ko" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Load translations for current language
    import(`@/locales/${language}.json`)
      .then((module) => setTranslations(module.default))
      .catch((err) => console.error("Failed to load translations:", err));
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
