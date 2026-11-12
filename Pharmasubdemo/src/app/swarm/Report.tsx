"use client";

import { AlertTriangle, ArrowDown, Check, X } from "lucide-react";
import falsifiers from "@data/swarm/falsifiers.json";
import { ARCH, DIMENSIONS } from "@/domain/swarm/archetypes";
import { formatFrequency, QUESTIONS_EN, type EnsembleResult } from "@/domain/swarm/ensemble";
import { FALSIFIERS_EN } from "@/i18n/dictionary";
import { useLang } from "@/i18n/LanguageProvider";

export default function Report({ ensemble }: { ensemble: EnsembleResult }) {
  const { lang, t } = useLang();
  const frequency = (id: string) => ensemble.frequencies.find((item) => item.id === id)!;
  const falsifierPassed = (test: string) => test === "DIVERGE" ? ensemble.divergence > .25 : frequency(test).p > .5;
  const gp = frequency("QGP"), fout = frequency("QFOUT"), hops = frequency("QHOPS");
  return <div className="swarm-report">
    <section className="report-intro"><div><div className="eyebrow">{t("report_eyebrow")}</div><h2>{t("report_h2")}</h2><p>{t("report_intro")}</p></div><div className="report-n"><strong className="mono">{ensemble.runs}</strong><span>{t("report_runs")}</span><small>{t("report_seeds")}</small></div></section>
    <section className="frequency-grid">{ensemble.frequencies.map((item) => <article className="frequency-card" key={item.id}><div className="frequency-id mono">{item.id}</div><h3>{lang === "en" ? QUESTIONS_EN[item.id] : item.question}</h3><strong className="frequency-value mono">{item.x}<span> / {item.n}</span></strong><p className="mono">{formatFrequency(item)}</p><div className="ci-track"><span style={{ left: `${item.lo * 100}%`, width: `${(item.hi - item.lo) * 100}%` }} /><i style={{ left: `${item.p * 100}%` }} /></div><small>{t("wilson_note")}</small></article>)}</section>
    <section className="report-section"><div className="report-section-heading"><div><div className="eyebrow">{t("fals_eyebrow")}</div><h2>{t("fals_h2")}</h2></div><span className="falsifier-alert"><AlertTriangle size={14} />{t("fals_objections", { n: falsifiers.filter((item) => !falsifierPassed(item.test)).length })}</span></div><div className="falsifier-table"><div className="falsifier-head"><span>{t("fals_id")}</span><span>{t("fals_claim")}</span><span>{t("fals_outcome")}</span><span>{t("fals_action")}</span></div>{falsifiers.map((item) => { const passed = falsifierPassed(item.test); const enF = FALSIFIERS_EN[item.id]; return <div className={`falsifier-row ${passed ? "holds" : "fired"}`} key={item.id}><span className="mono">{item.id}</span><div><strong>{lang === "en" && enF ? enF.claim : item.claim}</strong><span className="mono">{item.test}</span></div><div>{passed ? <><Check size={14} /><strong>{t("fals_holds")}</strong><span>{t("fals_holds_sub")}</span></> : <><X size={14} /><strong>{t("fals_fired")}</strong><span>{t("fals_fired_sub")}</span></>}</div><p>{lang === "en" && enF ? enF.if_false : item.if_false}</p></div>; })}</div></section>
    <section className="findings-section"><div className="eyebrow">{t("findings_eyebrow")}</div><h2>{t("findings_h2")}</h2><div className="finding-grid">
      <article><span className="finding-number">01</span><h3>{t("finding1_h")}</h3><p>{t("finding1_p", { x: gp.x, n: gp.n })}</p></article>
      <article><span className="finding-number">02</span><h3>{t("finding2_h")}</h3><p>{t("finding2_p", { foutX: fout.x, foutN: fout.n, hopsX: hops.x, hopsN: hops.n })}</p></article>
      <article><span className="finding-number">03</span><h3>{t("finding3_h")}</h3><p>{t("finding3_p", { divergence: ensemble.divergence.toFixed(3) })}</p></article>
    </div></section>
    <section className="priors-section"><div className="report-section-heading"><div><div className="eyebrow">{t("priors_eyebrow")}</div><h2>{t("priors_h2")}</h2></div><span className="mono tiny">{t("priors_note")}</span></div><div className="prior-table-wrap"><table className="prior-table"><thead><tr><th>{t("priors_archetype")}</th><th>n</th>{DIMENSIONS.map((dim) => <th key={dim.id}>{dim.id}</th>)}<th>voice</th><th>{t("priors_conviction")}</th></tr></thead><tbody>{Object.entries(ARCH).map(([key, archetype]) => <tr key={key}><td>{lang === "en" ? archetype.label_en : archetype.label}</td><td className="mono">{archetype.n}</td>{DIMENSIONS.map((dim) => <td key={dim.id}><span className="prior-value mono">{archetype.priors[dim.id].toFixed(2)}</span><span className="prior-bar"><i style={{ width: `${archetype.priors[dim.id] * 100}%` }} /></span></td>)}<td className="mono">{archetype.behav.voice.toFixed(2)}</td><td className="mono">{archetype.behav.conviction.toFixed(2)}</td></tr>)}</tbody></table></div></section>
    <section className="distribution-section"><div><div className="eyebrow">{t("dist_eyebrow")}</div><h2>{t("dist_h2")}</h2></div><div className="distribution-table"><div className="distribution-head"><span>{t("dist_dim")}</span><span>{t("dist_mean")}</span><span>sd</span><span>p10</span><span>p50</span><span>p90</span></div>{DIMENSIONS.map((dim) => { const d = ensemble.distributions[dim.id]; return <div className="distribution-row" key={dim.id}><strong>{lang === "en" ? dim.label_en : dim.label}</strong>{[d.mean, d.sd, d.p10, d.p50, d.p90].map((value, index) => <span className="mono" key={index}>{value.toFixed(3)}</span>)}</div>; })}</div></section>
    <section className="not-says"><ArrowDown size={20} /><div><h2>{t("not_says_h")}</h2><p>{t("not_says_p")}</p></div></section>
  </div>;
}
