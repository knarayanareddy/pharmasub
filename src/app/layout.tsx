import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { OfflineReady } from "@/components/OfflineReady";
import { getDictionary } from "@/i18n/dictionary";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { getLang } from "@/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const d = getDictionary(lang);
  return {
    title: { default: d.meta_default, template: "%s · Samenstelling" },
    description: d.meta_desc,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body>
        <OfflineReady />
        <LanguageProvider initialLang={lang}>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
