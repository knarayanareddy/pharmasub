import { Braces, FileJson, KeyRound, ShieldCheck } from "lucide-react";
import { AuditExplorer } from "@/components/AuditExplorer";
import { readAudit, verifyAudit } from "@/domain/hashchain";
import { RULES } from "@/domain/rules";
import "./verify.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit & bronnen" };
export default function VerifyPage() {
  const initial = { ...verifyAudit(), rows: readAudit() };
  return <div className="page verify-page"><div className="verify-heading"><div><div className="eyebrow">Verifieerbaar zonder leverancier</div><h1 className="page-title">Ieder besluit laat een spoor na.</h1><p className="page-intro">Een inspecteur kan de volgnummers, vorige hashes en canonieke payloads opnieuw berekenen. Geen database of leveranciersaccount nodig.</p></div><div className="audit-seal"><ShieldCheck size={25} /><span>SHA-256</span><small>hash-chained JSONL</small></div></div>
    <AuditExplorer initial={initial} />
    <section className="rules-section"><div className="section-heading"><div><div className="eyebrow">Regeltabel</div><h2>De regels zijn leesbaar — ook op papier.</h2></div><span className="mono tiny">PRECEDENTIE VAN BOVEN NAAR BENEDEN</span></div><div className="rules-grid">{Object.entries(RULES).map(([id, label], index) => <div className="rule-row" key={id}><span className="mono rule-order">{String(index + 1).padStart(2, "0")}</span><span className="rule-chip">{id}</span><strong>{label}</strong></div>)}</div></section>
    <section className="verification-explainer"><div><KeyRound size={20} /><h3>1. Canonieke payload</h3><p>Sleutels worden op ieder niveau gesorteerd. Dezelfde gebeurtenis geeft daardoor altijd exact dezelfde bytes.</p><span className="mono">canonicalJson(row)</span></div><div><Braces size={20} /><h3>2. Verborgen wijziging wordt zichtbaar</h3><p>De hash dekt seq, tijd, actor, actie, subject, payload en de vorige hash. Eén letter verschil breekt de controle.</p><span className="mono">sha256(canonicalJson)</span></div><div><FileJson size={20} /><h3>3. Lokaal en overdraagbaar</h3><p>Het JSONL-bestand en de regeltabel blijven leesbaar als de leverancier verdwijnt. De apotheek behoudt het bewijs.</p><span className="mono">npx tsx scripts/verify-chain.ts</span></div></section>
  </div>;
}
