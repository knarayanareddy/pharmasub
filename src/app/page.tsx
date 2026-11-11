import Link from "next/link";
import { ArrowRight, BookOpen, Braces, Check, FileCheck2, ShieldCheck, X } from "lucide-react";
import { CaseExplorer, type CaseSummary } from "@/components/CaseExplorer";
import { StatTile } from "@/components/Primitives";
import { cases } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";
import { getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import "./home.css";

export default async function HomePage() {
  const lang = await getLang();
  const d = getDictionary(lang);
  const summaries: CaseSummary[] = cases.map((c) => {
    const advice = buildAdvice(c);
    const n = Number(c.case_id.slice(2));
    return {
      case_id: c.case_id, substance: c.substance, atc: c.atc, strength: c.strength, form: c.form,
      insurer: c.insurer, flags: c.patient_flags, valid: advice.chains.filter((chain) => chain.status === "geldig").length,
      refused: advice.refusals.length,
      scenario: [17, 22, 23, 24, 25, 26, 27, 28, 29, 30].includes(n) ? "geen veilige keten" : [4, 12, 13, 14, 15, 16, 18, 19, 20, 21].includes(n) ? "sterkte / verpakking" : "gelijke sterkte",
    };
  });
  const validCount = summaries.filter((item) => item.valid > 0).length;
  const refusalCount = summaries.reduce((sum, item) => sum + item.refused, 0);
  return <div className="page home-page">
    <section className="home-hero">
      <div className="hero-copy">
        <div className="eyebrow">{d.home_eyebrow}</div>
        <h1>{d.home_h1a}<br /><em>{d.home_h1b}</em></h1>
        <p>{d.home_intro}</p>
        <div className="hero-actions"><Link href="/case/C-004" className="btn primary">{d.home_cta_demo} <ArrowRight size={16} /></Link><Link href="/swarm" className="btn">{d.home_cta_swarm}</Link></div>
        <div className="hero-assurance"><ShieldCheck size={16} /><span>{d.home_assurance}</span></div>
      </div>
      <div className="hero-refusal">
        <div className="hero-card-top"><span className="mono">C-017 · SALBUTAMOL</span><span className="live-label"><i /> {d.hero_live}</span></div>
        <div className="hero-product"><span>{d.hero_prescribed}</span><strong>{d.hero_product_name}</strong><small>{d.hero_routes}</small></div>
        <div className="mini-chain rejected"><span className="chain-icon"><X size={16} /></span><div><strong>{d.hero_reject_title}</strong><p>{d.hero_reject_text}</p><span className="rule-chip reject">P-STR-01</span></div></div>
        <div className="mini-chain unknown"><span className="chain-icon">?</span><div><strong>{d.hero_unknown_title}</strong><p>{d.hero_unknown_text}</p><span className="rule-chip unknown">P-REIMB-01</span></div></div>
        <div className="hero-card-bottom"><span>{d.hero_zero}</span><Link href="/case/C-017">{d.hero_read} <ArrowRight size={13} /></Link></div>
      </div>
    </section>
    <section className="stats-panel panel" aria-label={d.stats_aria}>
      <StatTile value={d.stat1_value} label={d.stat1_label} note={d.stat1_note} />
      <StatTile value={d.stat2_value} label={d.stat2_label} note={d.stat2_note} />
      <StatTile value={d.stat3_value} label={d.stat3_label} note={d.stat3_note} />
      <StatTile value={d.stat4_value} label={d.stat4_label} note={d.stat4_note} />
    </section>
    <section className="proof-row">
      <div><FileCheck2 size={18} /><strong>{validCount}/30</strong><span>{d.proof_valid}</span></div>
      <div><X size={18} /><strong>{refusalCount}</strong><span>{d.proof_refusals}</span></div>
      <div><Braces size={18} /><strong>100%</strong><span>{d.proof_deterministic}</span></div>
      <div><BookOpen size={18} /><strong>{lang === "en" ? "Snapshot date" : "Peildatum"}</strong><span>{d.proof_source}</span></div>
    </section>
    <CaseExplorer items={summaries} />
    <section className="sovereignty panel">
      <div><div className="eyebrow">{d.sov_eyebrow}</div><h2>{d.sov_h2}</h2><p>{d.sov_p}</p></div>
      <div className="sovereignty-steps">{[d.sov_step1, d.sov_step2, d.sov_step3].map((text, index) => <div key={text}><span>{index + 1}</span><strong>{text}</strong>{index < 2 && <ArrowRight size={16} />}</div>)}</div>
      <div className="energy-note"><Check size={15} /><span>{d.energy_note}</span></div>
    </section>
  </div>;
}
