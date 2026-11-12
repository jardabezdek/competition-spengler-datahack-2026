"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";

type LanguageState = { language: Locale; t: Dictionary };

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({
  language,
  dictionary,
  children,
}: {
  language: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  return <LanguageContext.Provider value={{ language, t: dictionary }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const state = useContext(LanguageContext);
  if (!state) throw new Error("useLanguage needs a LanguageProvider");
  return state;
}
