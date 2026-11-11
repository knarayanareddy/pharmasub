"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Download, FileText, LockKeyhole, Printer, SendHorizontal, ShieldCheck, ShieldX, Stethoscope, UserRound, X } from "lucide-react";
import { useState } from "react";
import type { Edit, SubstitutionAdvice } from "@/domain/types";
import { ChainCard } from "./ChainCard";
import { RefusalRow } from "./RefusalRow";
import { FlagPill, RuleChip, SourceLine } from "./Primitives";

const flagLabels: Record<string, string> = { renaal: "Nierfunctie", zwangerschap: "Zwangerschap", pediatrisch: "Pediatrisch", allergie_penicilline: "Penicilline-allergie", allergie_nsaid: "NSAID-allergie", leverfunctie: "Leverfunctie" };
const stages = ["Input", "Bronnen", "Ketens", "Gate", "Rang", "Weigeringen", "Mens"];

export function CaseWorkspace({ initialAdvice, noticeText }: { initialAdvice: SubstitutionAdvice; noticeText: string }) {
  const [advice, setAdvice] = useState(initialAdvice);
  const [selected, setSelected] = useState<string | null>(initialAdvice.approved?.chain_id || null);
  const [by, setBy] = useState(initialAdvice.approved?.by || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gpText, setGpText] = useState(initialAdvice.gp_message_nl);
  const [patientText, setPatientText] = useState(initialAdvice.patient_text_nl);
  const valid = advice.chains.filter((chain) => chain.status === "geldig");
  const c = advice.case;
  const baseSource = advice.chains.flatMap((chain) => chain.sources)[0] || { doc: "Regeltabel Samenstelling · voorbeelddata", field: "casus", date: "2026-11-01", sha256: "n.v.t." };

  async function approve(withEdits = false) {
    if (!selected || !by.trim()) return;
    setBusy(true); setError("");
    const edits: Edit[] = withEdits && advice.approved ? [
      ...(gpText !== advice.gp_message_nl ? [{ field: "gp_message" as const, from: advice.gp_message_nl, to: gpText, by, at: new Date().toISOString(), note_nl: "Tekst aangepast door apotheker" }] : []),
      ...(patientText !== advice.patient_text_nl ? [{ field: "patient_text" as const, from: advice.patient_text_nl, to: patientText, by, at: new Date().toISOString(), note_nl: "B1-tekst aangepast door apotheker" }] : []),
    ] : [];
    try {
      const response = await fetch("/api/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ case: c, case_id: c.case_id, chain_id: selected, by, edits }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.error || "Goedkeuring mislukt");
      setAdvice(body.advice); setGpText(body.advice.gp_message_nl); setPatientText(body.advice.patient_text_nl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Goedkeuring mislukt"); }
    finally { setBusy(false); }
  }

  async function download(format: "pdf" | "json") {
    if (!advice.approved) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/export/${c.case_id}?format=${format}`, { method: "POST" });
      if (!response.ok) { const body = await response.json(); throw new Error(body.message || body.error); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${c.case_id}-afleveradvies.${format}`; anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Export mislukt"); }
    finally { setBusy(false); }
  }

  return <div className="page case-page">
    <div className="case-breadcrumb"><Link href="/"><ArrowLeft size={13} />Casussen</Link><ChevronRight size={12} /><span>{c.case_id}</span><ChevronRight size={12} /><span>Beoordeling</span></div>
    <div className="case-heading"><div><h1>{c.case_id} <span>/ {c.substance}</span></h1><p>Synthetische tekortcasus · peildatum 1 november 2026 · geen echte patiëntgegevens</p></div><div className="case-heading-actions">
      {advice.approved ? <Link className="btn" href={`/case/${c.case_id}/print`}><Printer size={15} />A4 weergave</Link> : <button className="btn" disabled><Printer size={15} />A4 vereist goedkeuring</button>}
      <button className="btn" disabled={!advice.approved || busy} onClick={() => download("pdf")}><Download size={15} />Exporteer PDF</button>
    </div></div>
    <div className="workflow-bar" aria-label="Zeven controles stappen">{stages.map((stage, index) => <div key={stage} className={`workflow-step ${index < 6 ? "done" : "active"}`}><span>{index < 6 ? <Check size={11} /> : index + 1}</span><strong>{stage}</strong>{index < 6 && <ChevronRight size={12} />}</div>)}</div>
    <div className="case-grid">
      <aside className="case-column prescription-column">
        <div className="column-heading"><h2><FileText size={15} />Voorschrift & flags</h2><RuleChip>INPUT</RuleChip></div>
        <div className="prescription-body">
          <section className="case-section"><h3>Voorgeschreven</h3><SourceLine source={baseSource}><h3 className="prescription-name">{c.substance}</h3><div className="atc-line">ATC {c.atc}</div><div className="detail-list"><div><span className="fact-label">Sterkte</span><strong className="mono">{c.strength}</strong></div><div><span className="fact-label">Toedieningsvorm</span><strong>{c.form}</strong></div><div><span className="fact-label">Verpakking</span><strong>{c.package}</strong></div></div></SourceLine></section>
          <section className="case-section"><h3>Synthetische patiëntflags</h3><div className="patient-flags">{c.patient_flags.length ? c.patient_flags.map((flag) => <FlagPill key={flag}>{flagLabels[flag]}</FlagPill>) : <span className="small muted">Geen aanvullende flags</span>}</div><div className="age-band"><span>Leeftijdsband</span><strong className="mono">{c.age_band}</strong></div></section>
          <section className="case-section"><h3>Verzekeraar</h3><div className="age-band"><span>Preferentiemomentopname</span><strong>{c.insurer}</strong></div><p className="tiny muted">De momentopname is synthetisch. Een ontbrekende vermelding blijft expliciet onbekend.</p></section>
          <section className="case-section"><h3>Tekortmelding</h3><div className="notice-text">{noticeText}</div></section>
          <div className="human-lock"><LockKeyhole size={17} /><div><strong>De mens is de enige uitgang.</strong>Geen automatische aflevering, bestelling of verzending.</div></div>
        </div>
      </aside>
      <section className="case-column chains-column">
        <div className="column-heading"><h2><ShieldCheck size={15} />Bruikbare substitutieketens</h2><span className="count">{valid.length}</span></div>
        <div className="chains-body">
          <div className="valid-summary"><strong>{valid.length ? "Gerangschikt op minste wijzigingen" : "Geen keten komt door de gate"}</strong><span>1 hop maximaal</span></div>
          {valid.length ? <div className="chain-list">{valid.map((verdict, index) => <ChainCard key={verdict.chain_id} verdict={verdict} rank={index + 1} selected={selected === verdict.chain_id} onSelect={() => setSelected(verdict.chain_id)} />)}</div> : <div className="no-valid"><ShieldX size={30} /><h3>Nul geldige ketens.</h3><p>Dit is een volwaardige uitkomst. De redenen staan hiernaast; de apotheker neemt het vervolg over.</p></div>}
        </div>
        {selected && valid.some((chain) => chain.chain_id === selected) && <div className="approval-panel">
          {!advice.approved ? <><h3>Goedkeuring door de apotheker</h3><p>U beoordeelt het voorstel, de bronnen én alle weigeringen. Uw naam wordt in de hashketen vastgelegd.</p><div className="approval-form"><label><span className="section-kicker">Naam / apothekers-ID</span><input value={by} onChange={(event) => setBy(event.target.value)} placeholder="Bijv. synthetische apotheker AP-01" /></label><button className="btn primary" disabled={!by.trim() || busy} onClick={() => approve(false)}><UserRound size={15} />{busy ? "Bezig…" : "Keur keten goed"}</button></div></> : <><div className="approved-stamp"><ShieldCheck size={18} /><strong>Goedgekeurd door {advice.approved.by}</strong><span className="mono tiny">{new Date(advice.approved.at).toLocaleString("nl-NL")}</span></div><div className="approval-footer-note"><LockKeyhole size={13} />Vastgelegd in het auditspoor · geen verzending</div></>}
          {error && <div className="error-text">{error}</div>}
        </div>}
        {advice.approved && <div className="letters"><div className="letter-card"><div className="letter-heading"><h4>Bericht aan de huisarts</h4><span>max. 120 woorden · alleen scherm/PDF</span></div><textarea aria-label="Huisartsenbericht" value={gpText} onChange={(event) => setGpText(event.target.value)} /></div><div className="letter-card patient"><div className="letter-heading"><h4>Uitleg voor de patiënt</h4><span>B1 · geen doseeradvies</span></div><textarea aria-label="Patiëntuitleg" value={patientText} onChange={(event) => setPatientText(event.target.value)} /></div><div className="letter-actions"><button className="btn small" disabled={busy} onClick={() => approve(true)}>Log tekstwijziging</button><button className="btn small" disabled={busy} onClick={() => download("json")}><Download size={13} />JSON</button><span className="approval-footer-note"><SendHorizontal size={12} />P-NOSEND-01: er wordt niets verzonden.</span></div></div>}
      </section>
      <aside className="case-column refusals-column">
        <div className="column-heading"><h2><X size={15} />Afgewezen & onbekend</h2><span className="count">{advice.refusals.length}</span></div>
        <div className="refusals-body"><p className="refusal-intro">Altijd zichtbaar. Een weigering is een uitkomst, geen verborgen fout. Iedere reden citeert één primaire regel.</p>{advice.refusals.length ? <div className="refusal-list">{advice.refusals.map((verdict, index) => <RefusalRow key={verdict.chain_id} verdict={verdict} index={index} />)}</div> : <div className="empty-state"><Check size={20} /><p>Geen weigeringen in deze casus.</p></div>}</div>
      </aside>
    </div>
  </div>;
}
