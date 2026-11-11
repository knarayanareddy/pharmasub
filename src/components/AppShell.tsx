"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpenCheck, FileInput, FlaskConical, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Casussen", icon: BookOpenCheck },
  { href: "/intake", label: "Casus invoeren", icon: FileInput },
  { href: "/swarm", label: "Simulatielab", icon: FlaskConical },
  { href: "/verify", label: "Audit & bronnen", icon: ShieldCheck },
  { href: "/instrument", label: "Instrument", icon: Activity },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Direct naar inhoud</a>
      <div className="demo-strip"><span className="demo-dot" /> Demonstratieomgeving <span>·</span> alle gegevens zijn synthetisch <span>·</span> volledig lokaal en offline</div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Samenstelling home">
          <span className="brand-mark" aria-hidden="true"><i /><b /></span>
          <span><strong>samenstelling</strong><small>De wet, de vergoeding en de veiligheid — naast elkaar.</small></span>
        </Link>
        <nav className="main-nav" aria-label="Hoofdnavigatie">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" || pathname.startsWith("/case") : pathname.startsWith(href);
            return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={16} strokeWidth={1.8} /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="pharmacist-badge"><span>AP</span><div><strong>Apotheker</strong><small>beslisser in elke casus</small></div></div>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <span>Demo — synthetische casussen. Geen echte patiëntgegevens. Geen medisch advies.</span>
        <span className="mono">P-NOSEND-01 · niets wordt verzonden</span>
      </footer>
    </div>
  );
}
