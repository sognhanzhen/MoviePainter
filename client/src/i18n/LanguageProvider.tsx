import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  translate,
  type Language,
  type TranslationKey
} from "./messages";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LANGUAGE;
    }

    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  });

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(normalizeLanguage(nextLanguage));
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
