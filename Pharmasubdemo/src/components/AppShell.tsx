"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpenCheck, FileInput, FlaskConical, Map, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLang();
  const navigation = [
    { href: "/tour", label: t("nav_tour"), icon: Map },
    { href: "/", label: t("nav_cases"), icon: BookOpenCheck },
    { href: "/intake", label: t("nav_intake"), icon: FileInput },
    { href: "/swarm", label: t("nav_swarm"), icon: FlaskConical },
    { href: "/verify", label: t("nav_verify"), icon: ShieldCheck },
    { href: "/instrument", label: t("nav_instrument"), icon: Activity },
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">{t("skip_link")}</a>
      <div className="demo-strip"><span className="demo-dot" /> {t("demo_strip")}</div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Samenstelling home">
          <span className="brand-mark" aria-hidden="true"><i /><b /></span>
          <span><strong>samenstelling</strong><small>{t("brand_tagline")}</small></span>
        </Link>
        <nav className="main-nav" aria-label={t("nav_cases")}>
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" || pathname.startsWith("/case") : pathname.startsWith(href);
            return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={16} strokeWidth={1.8} /><span>{label}</span></Link>;
          })}
        </nav>
        <LanguageToggle />
        <div className="pharmacist-badge"><span>AP</span><div><strong>{t("badge_title")}</strong><small>{t("badge_sub")}</small></div></div>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <span>{t("footer_text")}</span>
        <span className="mono">{t("footer_nosend")}</span>
      </footer>
    </div>
  );
}
