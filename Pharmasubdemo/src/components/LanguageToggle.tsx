"use client";

import { useLang } from "@/i18n/LanguageProvider";

export function LanguageToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label={t("lang_label")}>
      <button type="button" aria-pressed={lang === "nl"} className={lang === "nl" ? "active" : ""} onClick={() => setLang("nl")}>
        NL
      </button>
      <span aria-hidden="true">|</span>
      <button type="button" aria-pressed={lang === "en"} className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
        EN
      </button>
    </div>
  );
}
