import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getCase } from "@/domain/data";
import { buildAdvice, withApproval } from "@/domain/engine";
import { latestApproval, latestCaseSnapshot } from "@/domain/hashchain";
import { createApproval } from "@/domain/types";
import { fill, getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import { PrintButton } from "./PrintButton";
import "./print.css";

export const dynamic = "force-dynamic";
export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const d = getDictionary(lang);
  const c = getCase(id) || latestCaseSnapshot(id);
  if (!c) notFound();
  const stored = latestApproval(id);
  if (!stored) return <div className="page print-gate"><div className="panel panel-body"><LockKeyhole size={28} /><h1>{d.gate_h1}</h1><p>{fill(d.gate_p, { id })}</p><p className="mono">E-APPROVAL-01</p><Link href={`/case/${id}`} className="btn primary"><ArrowLeft size={14} />{d.gate_back}</Link></div></div>;
  const base = buildAdvice(c);
  const advice = withApproval(base, createApproval(stored.chain_id, stored.by, stored.at), stored.edits);
  const chain = advice.chains.find((item) => item.chain_id === stored.chain_id)!;
  const link = chain.chain[0];
  return <div className="page print-page"><div className="print-toolbar no-print"><Link href={`/case/${id}`} className="btn"><ArrowLeft size={14} />{d.print_back}</Link><span>{d.print_note}{lang === "en" ? ` · ${d.doc_lang_note}` : ""}</span><PrintButton /></div><article className="a4-document">
    <header className="document-header"><div><strong>samenstelling</strong><span>AFLEVERADVIES · DEMONSTRATIE</span></div><div className="document-case"><strong>{id}</strong><span>{new Date(stored.at).toLocaleDateString("nl-NL")}</span></div></header>
    <section className="document-approval"><ShieldCheck size={20} /><div><strong>Beoordeeld en goedgekeurd door {stored.by}</strong><span>Keten {stored.chain_id} · de apotheker is de beslisser</span></div></section>
    <section className="document-patient"><div className="document-section-label">VOOR DE PATIËNT · B1</div><h1>Een ander product, dezelfde werkzame stof</h1><p>{advice.patient_text_nl}</p><div className="document-no-dose">Vraag uw apotheker om uitleg over het gebruik. Dit document bevat geen doseeradvies.</div></section>
    <section className="document-professional"><div className="document-section-label">VOOR DE PROFESSIONAL</div><div className="document-facts"><div><span>Werkzame stof</span><strong>{c.substance} · {c.atc}</strong></div><div><span>Gekozen product</span><strong>{link.product}</strong></div><div><span>Sterkte en vorm</span><strong>{link.strength} · {link.form}</strong></div><div><span>Verpakking / route</span><strong>{link.package} · {link.route}</strong></div></div><div className="document-rules">{chain.rules_passed.map((rule) => <span key={rule}>{rule}</span>)}</div><p className="document-source">Bron: {link.source.doc} · peildatum {link.source.date} · SHA-256 {link.source.sha256}</p></section>
    <section className="document-gp"><div className="document-section-label">BERICHT AAN DE HUISARTS · NIET VERZONDEN</div><p>{advice.gp_message_nl}</p></section>
    <footer className="document-footer"><span>Demo — synthetische casussen. Geen echte patiëntgegevens. Geen medisch advies.</span><span>P-NOSEND-01 · geen automatische verzending of aflevering</span></footer>
  </article></div>;
}
