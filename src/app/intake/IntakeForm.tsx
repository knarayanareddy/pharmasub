"use client";

import { ArrowRight, Check, FileInput, LockKeyhole, ScanText, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { substanceTable } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";
import { customCaseId, parseNotice } from "@/domain/intake";
import type { Case, PatientFlag, SubstitutionAdvice } from "@/domain/types";

const flagOptions: { id: PatientFlag; label: string }[] = [{ id: "renaal", label: "Nierfunctie" }, { id: "zwangerschap", label: "Zwangerschap" }, { id: "pediatrisch", label: "Pediatrisch" }, { id: "allergie_penicilline", label: "Penicilline-allergie" }, { id: "allergie_nsaid", label: "NSAID-allergie" }, { id: "leverfunctie", label: "Leverfunctie" }];
const example = "Leveranciersmelding 04-11-2026\nSalbutamol CF 100 mcg inhalatiepoeder, 200 doses\nTijdelijk niet leverbaar. Inschrijver: CZ. Verzoek om een product met dezelfde stof te beoordelen.";

export default function IntakeForm() {
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

  return <div className="page intake-page"><div className="intake-heading"><div><div className="eyebrow">Nieuwe synthetische casus</div><h1 className="page-title">Van melding naar controleerbare casus.</h1><p className="page-intro">Plak een melding in ieder formaat. Deterministische veldherkenning helpt bij het invullen; u controleert ieder veld vóór de regelgate start.</p></div><div className="intake-privacy"><LockKeyhole size={20} /><strong>Alleen flags en leeftijdsband</strong><span>Geen namen, identificerende gegevens, geboortedatum, beeld of contactgegevens.</span></div></div>
    <div className="intake-grid"><section className="panel intake-form-panel"><div className="panel-header"><h2><FileInput size={16} />1. Voorschrift & patiëntflags</h2><span className="rule-chip">SYNTHETISCH</span></div><div className="panel-body"><div className="form-grid"><label className="wide">Werkzame stof<select value={substance} onChange={(event) => selectSubstance(event.target.value)}>{Object.keys(substanceTable).map((name) => <option key={name}>{name}</option>)}<option value="onbekende stof">onbekende stof — test zichtbare misser</option></select></label><label>Sterkte<input value={strength} onChange={(event) => setStrength(event.target.value)} className="mono" /></label><label>Verpakking<input value={packageName} onChange={(event) => setPackageName(event.target.value)} /></label><label className="wide">Toedieningsvorm<input value={form} onChange={(event) => setForm(event.target.value)} /></label><label>Verzekeraar<select value={insurer} onChange={(event) => setInsurer(event.target.value as Case["insurer"])}>{["CZ", "VGZ", "Menzis", "onbekend"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Leeftijdsband<select value={ageBand} onChange={(event) => setAgeBand(event.target.value as Case["age_band"])}>{["0-11", "12-17", "18-64", "65+"].map((value) => <option key={value}>{value}</option>)}</select></label></div><fieldset className="flag-fieldset"><legend>Patiëntflags</legend><div>{flagOptions.map((flag) => <label key={flag.id} className={patientFlags.includes(flag.id) ? "checked" : ""}><input type="checkbox" checked={patientFlags.includes(flag.id)} onChange={(event) => setPatientFlags(event.target.checked ? [...patientFlags, flag.id] : patientFlags.filter((item) => item !== flag.id))} />{flag.label}</label>)}</div></fieldset></div></section>
      <section className="panel notice-input-panel"><div className="panel-header"><h2><ScanText size={16} />2. Tekortmelding</h2><span className="mono tiny">{notice.length} TEKENS</span></div><div className="panel-body"><textarea aria-label="Tekortmelding in vrij formaat" value={notice} onChange={(event) => setNotice(event.target.value)} /><div className="extraction-result"><div><strong>{extraction.fields_found} velden herkend</strong><span>Alleen veldherkenning, geen taalmodel en geen interpretatie van veiligheid.</span></div><button className="btn small" disabled={!extraction.fields_found} onClick={applyExtraction}>Vul herkende velden in<ArrowRight size={13} /></button></div><div className="extracted-fields">{Object.entries({ stof: extraction.substance, sterkte: extraction.strength, vorm: extraction.form, verpakking: extraction.package, verzekeraar: extraction.insurer }).map(([key, value]) => <span key={key} className={value ? "found" : ""}>{value ? <Check size={11} /> : "?"}<strong>{key}</strong>{value || "niet herkend"}</span>)}</div></div></section></div>
    <div className="intake-submit"><div><ShieldCheck size={18} /><span><strong>Daarna blijft de menselijke controle identiek.</strong> Geen automatische goedkeuring of verzending. De melding wordt niet opgeslagen.</span></div><button className="btn primary" disabled={!substance || !strength || !form || !packageName} onClick={submit}>Genereer en beoordeel ketens<ArrowRight size={16} /></button></div>
  </div>;
}
