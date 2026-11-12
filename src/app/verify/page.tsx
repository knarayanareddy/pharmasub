import type { Metadata } from "next";
import { VerifyView } from "@/components/VerifyView";
import { readAudit, verifyAudit } from "@/domain/hashchain";
import { getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import "./verify.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).meta_verify };
}

export default function VerifyPage() {
  const initial = { ...verifyAudit(), rows: readAudit() };
  return <VerifyView initial={initial} />;
}
