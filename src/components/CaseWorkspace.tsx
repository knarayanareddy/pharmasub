"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Download, FileText, LockKeyhole, Printer, SendHorizontal, ShieldCheck, ShieldX, UserRound, X } from "lucide-react";
import { useState } from "react";
import type { Edit, SubstitutionAdvice } from "@/domain/types";
import { useLang } from "@/i18n/LanguageProvider";
import { ChainCard } from "./ChainCard";
import { RefusalRow } from "./RefusalRow";
import { FlagPill, RuleChip, SourceLine } from "./Primitives";

export function CaseWorkspace({ initialAdvice, noticeText }: { initialAdvice: SubstitutionAdvice; noticeText: string }) {
  const { lang, t } = useLang();
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
  const stages = [t("stage_input"), t("stage_sources"), t("stage_chains"), t("stage_gate"), t("stage_rank"), t("stage_refusals"), t("stage_human")];

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
      if (!response.ok) throw new Error(body.message || body.error || t("approval_failed"));
      setAdvice(body.advice); setGpText(body.advice.gp_message_nl); setPatientText(body.advice.patient_text_nl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("approval_failed")); }
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
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("export_failed")); }
    finally { setBusy(false); }
  }

  return <div className="page case-page">
    <div className="case-breadcrumb"><Link href="/"><ArrowLeft size={13} />{t("breadcrumb_cases")}</Link><ChevronRight size={12} /><span>{c.case_id}</span><ChevronRight size={12} /><span>{t("breadcrumb_review")}</span></div>
    <div className="case-heading"><div><h1>{c.case_id} <span>/ {c.substance}</span></h1><p>{t("case_sub")}</p></div><div className="case-heading-actions">
      {advice.approved ? <Link className="btn" href={`/case/${c.case_id}/print`}><Printer size={15} />{t("btn_a4")}</Link> : <button className="btn" disabled><Printer size={15} />{t("btn_a4_locked")}</button>}
      <button className="btn" disabled={!advice.approved || busy} onClick={() => download("pdf")}><Download size={15} />{t("btn_pdf")}</button>
    </div></div>
    <div className="workflow-bar" aria-label={t("workflow_label")}>{stages.map((stage, index) => <div key={stage} className={`workflow-step ${index < 6 ? "done" : "active"}`}><span>{index < 6 ? <Check size={11} /> : index + 1}</span><strong>{stage}</strong>{index < 6 && <ChevronRight size={12} />}</div>)}</div>
    <div className="case-grid">
      <aside className="case-column prescription-column">
        <div className="column-heading"><h2><FileText size={15} />{t("prescription_title")}</h2><RuleChip>INPUT</RuleChip></div>
        <div className="prescription-body">
          <section className="case-section"><h3>{t("prescribed")}</h3><SourceLine source={baseSource}><h3 className="prescription-name">{c.substance}</h3><div className="atc-line">ATC {c.atc}</div><div className="detail-list"><div><span className="fact-label">{t("fact_strength")}</span><strong className="mono">{c.strength}</strong></div><div><span className="fact-label">{t("fact_form")}</span><strong>{c.form}</strong></div><div><span className="fact-label">{t("fact_package")}</span><strong>{c.package}</strong></div></div></SourceLine></section>
          <section className="case-section"><h3>{t("flags_title")}</h3><div className="patient-flags">{c.patient_flags.length ? c.patient_flags.map((flag) => <FlagPill key={flag}>{t(`flag_${flag}`)}</FlagPill>) : <span className="small muted">{t("no_extra_flags")}</span>}</div><div className="age-band"><span>{t("age_band")}</span><strong className="mono">{c.age_band}</strong></div></section>
          <section className="case-section"><h3>{t("insurer_title")}</h3><div className="age-band"><span>{t("snapshot_label")}</span><strong>{c.insurer}</strong></div><p className="tiny muted">{t("snapshot_note")}</p></section>
          <section className="case-section"><h3>{t("notice_title")}</h3>{noticeText ? <><div className="notice-text">{noticeText}</div>{lang === "en" && <p className="tiny muted">{t("notice_lang_note")}</p>}</> : <div className="notice-text">{t("notice_none")}</div>}</section>
          <div className="human-lock"><LockKeyhole size={17} /><div><strong>{t("human_lock_title")}</strong>{t("human_lock_text")}</div></div>
        </div>
      </aside>
      <section className="case-column chains-column">
        <div className="column-heading"><h2><ShieldCheck size={15} />{t("chains_title")}</h2><span className="count">{valid.length}</span></div>
        <div className="chains-body">
          <div className="valid-summary"><strong>{valid.length ? t("ranked") : t("no_chain")}</strong><span>{t("one_hop")}</span></div>
          {valid.length ? <div className="chain-list">{valid.map((verdict, index) => <ChainCard key={verdict.chain_id} verdict={verdict} rank={index + 1} selected={selected === verdict.chain_id} onSelect={() => setSelected(verdict.chain_id)} />)}</div> : <div className="no-valid"><ShieldX size={30} /><h3>{t("no_valid_h2")}</h3><p>{t("no_valid_p")}</p></div>}
        </div>
        {selected && valid.some((chain) => chain.chain_id === selected) && <div className="approval-panel">
          {!advice.approved ? <><h3>{t("approval_h3")}</h3><p>{t("approval_p")}</p><div className="approval-form"><label><span className="section-kicker">{t("approval_name")}</span><input value={by} onChange={(event) => setBy(event.target.value)} placeholder={t("approval_placeholder")} /></label><button className="btn primary" disabled={!by.trim() || busy} onClick={() => approve(false)}><UserRound size={15} />{busy ? t("approval_busy") : t("approval_btn")}</button></div></> : <><div className="approved-stamp"><ShieldCheck size={18} /><strong>{t("approved_by", { by: advice.approved.by })}</strong><span className="mono tiny">{new Date(advice.approved.at).toLocaleString(lang === "en" ? "en-GB" : "nl-NL")}</span></div><div className="approval-footer-note"><LockKeyhole size={13} />{t("audit_note")}</div></>}
          {error && <div className="error-text">{error}</div>}
        </div>}
        {advice.approved && <div className="letters">
          <div className="letter-card"><div className="letter-heading"><h4>{t("gp_title")}</h4><span>{t("gp_sub")}</span></div><textarea aria-label={t("gp_title")} value={gpText} onChange={(event) => setGpText(event.target.value)} />{lang === "en" && <div className="letter-gloss"><div className="letter-gloss-head"><span>{t("gloss_label")}</span><span>{t("gloss_original")}</span></div>{gpText === advice.gp_message_nl && advice.gp_message_en ? advice.gp_message_en : t("gloss_edited")}</div>}</div>
          <div className="letter-card patient"><div className="letter-heading"><h4>{t("patient_title")}</h4><span>{t("patient_sub")}</span></div><textarea aria-label={t("patient_title")} value={patientText} onChange={(event) => setPatientText(event.target.value)} />{lang === "en" && <div className="letter-gloss"><div className="letter-gloss-head"><span>{t("gloss_label")}</span><span>{t("gloss_original")}</span></div>{patientText === advice.patient_text_nl && advice.patient_text_en ? advice.patient_text_en : t("gloss_edited")}</div>}</div>
          <div className="letter-actions"><button className="btn small" disabled={busy} onClick={() => approve(true)}>{t("log_edit")}</button><button className="btn small" disabled={busy} onClick={() => download("json")}><Download size={13} />{t("json_btn")}</button><span className="approval-footer-note"><SendHorizontal size={12} />{t("nosend_note")}</span></div>
        </div>}
      </section>
      <aside className="case-column refusals-column">
        <div className="column-heading"><h2><X size={15} />{t("refusals_title")}</h2><span className="count">{advice.refusals.length}</span></div>
        <div className="refusals-body"><p className="refusal-intro">{t("refusals_intro")}</p>{advice.refusals.length ? <div className="refusal-list">{advice.refusals.map((verdict, index) => <RefusalRow key={verdict.chain_id} verdict={verdict} index={index} />)}</div> : <div className="empty-state"><Check size={20} /><p>{t("no_refusals")}</p></div>}</div>
      </aside>
    </div>
  </div>;
}
