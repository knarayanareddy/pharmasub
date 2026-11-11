import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { OfflineReady } from "@/components/OfflineReady";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Samenstelling — van tekort naar beargumenteerd besluit", template: "%s · Samenstelling" },
  description: "Deterministische substitutieketens met wet, vergoeding, veiligheid en iedere weigering zichtbaar.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="nl"><body><OfflineReady /><AppShell>{children}</AppShell></body></html>;
}
