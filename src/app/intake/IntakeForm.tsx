"use client";

import { ArrowRight, Check, FileInput, LockKeyhole, ScanText, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { substanceTable } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";
import { customCaseId, parseNotice } from "@/domain/intake";
import type { Case, PatientFlag, SubstitutionAdvice } from "@/domain/types";
import { useLang } from "@/i18n/LanguageProvider";

const flagIds: PatientFlag[] = ["renaal", "zwangerschap", "pediatrisch", "allergie_penicilline", "allergie_nsaid", "leverfunctie"];
const example = "Leveranciersmelding 04-11-2026\nSalbutamol CF 100 mcg inhalatiepoeder, 200 doses\nTijdelijk niet leverbaar. Inschrijver: CZ. Verzoek om een product met dezelfde stof te beoordelen.";

export default function IntakeForm() {
  const { lang, t } = useLang();
  const [substance, setSubstance] = useState("salbutamol");
  const [strength, setStrength] = useState("100 mcg");
  const [form, setForm] = useState("inhalatiepoeder");
  const [packageName, setPackageName] = useState("200 doses");
  const [insurer, setInsurer] = useState<Case["insurer"]>("CZ");
  const [ageBand, setAgeBand] = useState<Case["age_band"]>("18-64");
  const [patientFlags, setPatientFlags] = useState<PatientFlag[]>([]);
  const [notice, setNotice] = useState(example);
  const [advice, setAdvice] = useState<SubstitutionAdvice | null>(null);
  const extraction = useMemo(() => parseNotice(notice), [notice]);

  function selectSubstance(value: string) {
    setSubstance(value);
    const product = substanceTable[value]?.products[0];
    if (product) { setStrength(product.strength); setForm(product.form); setPackageName(product.packages[0]); }
  }
  function applyExtraction() {
    if (extraction.substance) selectSubstance(extraction.substance);
    if (extraction.strength) setStrength(extraction.strength);
    if (extraction.form) setForm(extraction.form);
    if (extraction.package) setPackageName(extraction.package);
    if (extraction.insurer) setInsurer(extraction.insurer);
  }
  function submit() {
    const base = { substance, strength, form, package: packageName, patient_flags: patientFlags, insurer, notice_ref: null, age_band: ageBand };
    const c: Case = { ...base, case_id: customCaseId(base), atc: substanceTable[substance]?.atc || "ONBEKEND" };
    setAdvice(buildAdvice(c));
  }
  if (advice) return <CaseWorkspace initialAdvice={advice} noticeText={notice} />;

  return <div className="page intake-page"><div className="intake-heading"><div><div className="eyebrow">{t("intake_eyebrow")}</div><h1 className="page-title">{t("intake_h1")}</h1><p className="page-intro">{t("intake_intro")}</p></div><div className="intake-privacy"><LockKeyhole size={20} /><strong>{t("privacy_title")}</strong><span>{t("privacy_text")}</span></div></div>
    <div className="intake-grid"><section className="panel intake-form-panel"><div className="panel-header"><h2><FileInput size={16} />{t("step1_title")}</h2><span className="rule-chip">{t("synthetic_tag")}</span></div><div className="panel-body"><div className="form-grid"><label className="wide">{t("substance")}<select value={substance} onChange={(event) => selectSubstance(event.target.value)}>{Object.keys(substanceTable).map((name) => <option key={name}>{name}</option>)}<option value="onbekende stof">{t("unknown_opt")}</option></select></label><label>{t("strength")}<input value={strength} onChange={(event) => setStrength(event.target.value)} className="mono" /></label><label>{t("package")}<input value={packageName} onChange={(event) => setPackageName(event.target.value)} /></label><label className="wide">{t("form")}<input value={form} onChange={(event) => setForm(event.target.value)} /></label><label>{t("insurer")}<select value={insurer} onChange={(event) => setInsurer(event.target.value as Case["insurer"])}>{["CZ", "VGZ", "Menzis", "onbekend"].map((value) => <option key={value} value={value}>{value === "onbekend" && lang === "en" ? "onbekend (unknown)" : value}</option>)}</select></label><label>{t("age_band")}<select value={ageBand} onChange={(event) => setAgeBand(event.target.value as Case["age_band"])}>{["0-11", "12-17", "18-64", "65+"].map((value) => <option key={value}>{value}</option>)}</select></label></div><fieldset className="flag-fieldset"><legend>{t("flags_legend")}</legend><div>{flagIds.map((id) => <label key={id} className={patientFlags.includes(id) ? "checked" : ""}><input type="checkbox" checked={patientFlags.includes(id)} onChange={(event) => setPatientFlags(event.target.checked ? [...patientFlags, id] : patientFlags.filter((item) => item !== id))} />{t(`flag_${id}`)}</label>)}</div></fieldset></div></section>
      <section className="panel notice-input-panel"><div className="panel-header"><h2><ScanText size={16} />{t("step2_title")}</h2><span className="mono tiny">{t("chars", { n: notice.length })}</span></div><div className="panel-body"><textarea aria-label={t("notice_label")} value={notice} onChange={(event) => setNotice(event.target.value)} />{lang === "en" && <p className="tiny muted">{t("example_note")}</p>}<div className="extraction-result"><div><strong>{t("fields_found", { n: extraction.fields_found })}</strong><span>{t("fields_help")}</span></div><button className="btn small" disabled={!extraction.fields_found} onClick={applyExtraction}>{t("fill_btn")}<ArrowRight size={13} /></button></div><div className="extracted-fields">{([
        [t("field_substance"), extraction.substance],
        [t("field_strength"), extraction.strength],
        [t("field_form"), extraction.form],
        [t("field_package"), extraction.package],
        [t("field_insurer"), extraction.insurer],
      ] as const).map(([key, value]) => <span key={key} className={value ? "found" : ""}>{value ? <Check size={11} /> : "?"}<strong>{key}</strong>{value || t("not_recognized")}</span>)}</div></div></section></div>
    <div className="intake-submit"><div><ShieldCheck size={18} /><span><strong>{t("submit_title")}</strong> {t("submit_text")}</span></div><button className="btn primary" disabled={!substance || !strength || !form || !packageName} onClick={submit}>{t("submit_btn")}<ArrowRight size={16} /></button></div>
  </div>;
}
