"use client";
import { Printer } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

export function PrintButton() {
  const { t } = useLang();
  return <button className="btn primary no-print" onClick={() => window.print()}><Printer size={15} />{t("print_btn")}</button>;
}
