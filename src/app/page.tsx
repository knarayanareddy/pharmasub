import Link from "next/link";
import { ArrowRight, BookOpen, Braces, Check, FileCheck2, ShieldCheck, X } from "lucide-react";
import { CaseExplorer, type CaseSummary } from "@/components/CaseExplorer";
import { StatTile } from "@/components/Primitives";
import { cases } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";
import "./home.css";

export default function HomePage() {
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
        <div className="eyebrow">Substitutie, met de reden erbij</div>
        <h1>Beschikbaarheid is opgelost.<br /><em>Het werk niet.</em></h1>
        <p>Samenstelling maakt van een tekortmelding beargumenteerde substitutieketens — met de wet, de vergoeding en de veiligheid naast elkaar. <strong>Inclusief ieder voorstel dat wij weigeren.</strong></p>
        <div className="hero-actions"><Link href="/case/C-004" className="btn primary">Open demonstratiecasus <ArrowRight size={16} /></Link><Link href="/swarm" className="btn">Verken het simulatielab</Link></div>
        <div className="hero-assurance"><ShieldCheck size={16} /><span>Geen model beslist. De apotheker keurt iedere regel goed.</span></div>
      </div>
      <div className="hero-refusal">
        <div className="hero-card-top"><span className="mono">C-017 · SALBUTAMOL</span><span className="live-label"><i /> LIVE REGELGATE</span></div>
        <div className="hero-product"><span>Voorgeschreven</span><strong>100 mcg inhalatiepoeder</strong><small>4 mogelijke routes beoordeeld</small></div>
        <div className="mini-chain rejected"><span className="chain-icon"><X size={16} /></span><div><strong>2 mg/5 ml drank</strong><p>Ander dosisinterval — niet uitwisselbaar zonder controle.</p><span className="rule-chip reject">P-STR-01</span></div></div>
        <div className="mini-chain unknown"><span className="chain-icon">?</span><div><strong>Vergoeding niet vast te stellen</strong><p>Verzekeraar onbekend. Onbekend wordt nooit groen.</p><span className="rule-chip unknown">P-REIMB-01</span></div></div>
        <div className="hero-card-bottom"><span>0 geldige ketens</span><Link href="/case/C-017">Lees iedere weigering <ArrowRight size={13} /></Link></div>
      </div>
    </section>
    <section className="stats-panel panel" aria-label="Context cijfers">
      <StatTile value="26.000" label="tekortmeldingen per dag" note="NRC / KNMP · mrt. 2026" />
      <StatTile value="±96" label="dagen per tekort" note="gemiddelde duur" />
      <StatTile value="1 FTE" label="zoekwerk per apotheek" note="het echte knelpunt" />
      <StatTile value="46%" label="meldt gezondheidsachteruitgang" note="LEF + SIR · 9 nov. 2026" />
    </section>
    <section className="proof-row">
      <div><FileCheck2 size={18} /><strong>{validCount}/30</strong><span>casussen met een geldige keten</span></div>
      <div><X size={18} /><strong>{refusalCount}</strong><span>weigeringen met regel en reden</span></div>
      <div><Braces size={18} /><strong>100%</strong><span>deterministische regellogica</span></div>
      <div><BookOpen size={18} /><strong>Peildatum</strong><span>en bron bij ieder klinisch veld</span></div>
    </section>
    <CaseExplorer items={summaries} />
    <section className="sovereignty panel">
      <div><div className="eyebrow">Uitlegbaar tot op de bron</div><h2>De regels blijven van de apotheek.</h2><p>De regels staan in een leesbare tabel. De bronnen zijn publieke documenten. De enige uitgang naar een document is een namelijk goedkeurende apotheker.</p></div>
      <div className="sovereignty-steps">{["Het model leest", "De regels beslissen", "De apotheker keurt goed"].map((text, index) => <div key={text}><span>{index + 1}</span><strong>{text}</strong>{index < 2 && <ArrowRight size={16} />}</div>)}</div>
      <div className="energy-note"><Check size={15} /><span><strong>±1,0 kWh</strong> warm / <strong>±2,6 kWh</strong> koud per 1.000 casussen · cache op documenthash</span></div>
    </section>
  </div>;
}
