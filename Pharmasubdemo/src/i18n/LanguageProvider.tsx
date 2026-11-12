"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
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

function writeLangCookie(lang: Lang) {
  if (typeof document === "undefined") return;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const sameSite = isHttps ? "; SameSite=None; Secure" : "; SameSite=Lax";
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}${sameSite}`;
  document.documentElement.lang = lang;
}

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    try {
      const urlLang = new URLSearchParams(window.location.search).get("lang");
      const stored = window.localStorage.getItem(LANG_COOKIE);
      const preferred = isLang(urlLang) ? urlLang : isLang(stored) ? stored : null;
      if (preferred) {
        if (preferred !== lang) setLangState(preferred);
        writeLangCookie(preferred);
      }
    } catch {
      /* ignore storage errors */
    }
    // Sync once on mount so iframe reloads without third-party cookies honour localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      try {
        window.localStorage.setItem(LANG_COOKIE, next);
      } catch {
        /* ignore storage errors */
      }
      writeLangCookie(next);
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
