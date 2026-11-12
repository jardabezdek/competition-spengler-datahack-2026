import type en from "@/app/[lang]/dictionaries/en.json";
import type { StatKey } from "@/lib/player-stats";

export const locales = ["de", "en"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = { de: "Deutsch", en: "English" };

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

export const redesignPath = (locale: Locale) => `/${locale}/redesign`;

export function format(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

type StatCopy = { label: string; description: string };

/** Stat copy is optional: English comes from docs/data_dictionary.md. */
export type Dictionary = typeof en & {
  teamStats: { stats?: Record<string, StatCopy> };
  playerStats: { columns?: Partial<Record<StatKey, string>>; notes?: Partial<Record<StatKey, StatCopy>> };
};

export type CaptionKey = keyof Dictionary["replay"]["captions"];
