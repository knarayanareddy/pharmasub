import { Braces, FileJson, KeyRound, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { AuditExplorer } from "@/components/AuditExplorer";
import { readAudit, verifyAudit } from "@/domain/hashchain";
import { RULES, RULES_EN, type RuleId } from "@/domain/rules";
import { getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import "./verify.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).meta_verify };
}

export default async function VerifyPage() {
  const lang = await getLang();
  const d = getDictionary(lang);
  const initial = { ...verifyAudit(), rows: readAudit() };
  return <div className="page verify-page"><div className="verify-heading"><div><div className="eyebrow">{d.verify_eyebrow}</div><h1 className="page-title">{d.verify_h1}</h1><p className="page-intro">{d.verify_intro}</p></div><div className="audit-seal"><ShieldCheck size={25} /><span>SHA-256</span><small>hash-chained JSONL</small></div></div>
    <AuditExplorer initial={initial} />
    <section className="rules-section"><div className="section-heading"><div><div className="eyebrow">{d.rules_eyebrow}</div><h2>{d.rules_h2}</h2></div><span className="mono tiny">{d.rules_precedence}</span></div><div className="rules-grid">{Object.entries(RULES).map(([id, label], index) => <div className="rule-row" key={id}><span className="mono rule-order">{String(index + 1).padStart(2, "0")}</span><span className="rule-chip">{id}</span><div><strong>{lang === "en" ? RULES_EN[id as RuleId] : label}</strong>{lang === "en" && <span className="tiny muted rule-nl-orig">{label}</span>}</div></div>)}</div></section>
    <section className="verification-explainer"><div><KeyRound size={20} /><h3>{d.exp1_h}</h3><p>{d.exp1_p}</p><span className="mono">canonicalJson(row)</span></div><div><Braces size={20} /><h3>{d.exp2_h}</h3><p>{d.exp2_p}</p><span className="mono">sha256(canonicalJson)</span></div><div><FileJson size={20} /><h3>{d.exp3_h}</h3><p>{d.exp3_p}</p><span className="mono">npx tsx scripts/verify-chain.ts</span></div></section>
  </div>;
}
