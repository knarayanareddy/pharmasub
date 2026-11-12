"use client";

import Link from "next/link";
import { useLang } from "@/i18n/LanguageProvider";

export function NotFoundView() {
  const { t } = useLang();
  return (
    <div className="page">
      <div className="panel panel-body">
        <div className="eyebrow">{t("notfound_eyebrow")}</div>
        <h1 className="page-title">{t("notfound_h1")}</h1>
        <p className="page-intro">{t("notfound_p")}</p>
        <Link className="btn primary" href="/">{t("notfound_btn")}</Link>
      </div>
    </div>
  );
}
