"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { fill, getDictionary, isLang, LANG_COOKIE, type Lang } from "./dictionary";

interface LanguageContextValue {
  lang: Lang;
  dict: Record<string, string>;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const nlDict = getDictionary("nl") as Record<string, string>;

// Default is Dutch so components render identically without a provider
// (e.g. in unit tests that render a single component directly).
const LanguageContext = createContext<LanguageContextValue>({
  lang: "nl",
  dict: nlDict,
  setLang: () => {},
  t: (key: string, vars?: Record<string, string | number>) => fill(nlDict[key] ?? key, vars),
});

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      document.documentElement.lang = next;
      router.refresh();
    },
    [router],
  );

  const dict = getDictionary(lang) as Record<string, string>;
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const template = dict[key] ?? nlDict[key] ?? key;
      return fill(template, vars);
    },
    [dict],
  );

  return <LanguageContext.Provider value={{ lang, dict, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}

export function parseLang(value: string | null | undefined): Lang {
  return isLang(value) ? value : "nl";
}
