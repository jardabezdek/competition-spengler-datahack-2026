import type { Dictionary, Locale } from "@/lib/i18n";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  de: () => import("./dictionaries/de.json").then((module) => module.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
