"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Braces, Check, FileCheck2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CaseExplorer, type CaseSummary } from "@/components/CaseExplorer";
import { PitchDeck } from "@/components/PitchDeck";
import { StatTile } from "@/components/Primitives";
import { useLang } from "@/i18n/LanguageProvider";

export function HomeView({
  summaries,
  validCount,
  refusalCount,
}: {
  summaries: CaseSummary[];
  validCount: number;
  refusalCount: number;
}) {
  const { lang, t } = useLang();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (window.location.hash === "#demo" || params.get("view") === "demo") {
      setStep(2);
    } else if (params.get("slide") === "2") {
      setStep(1);
    }
  }, []);

  return (
    <div className="page home-page">
      <PitchDeck step={step} onStepChange={setStep} />
      <div className={step === 2 ? "demo-stage active" : "demo-stage is-behind"} aria-hidden={step !== 2}>
        <section className="home-hero">
          <div className="hero-copy">
            <div className="eyebrow">{t("home_eyebrow")}</div>
            <h1>{t("home_h1a")}<br /><em>{t("home_h1b")}</em></h1>
            <p>{t("home_intro")}</p>
            <div className="hero-actions">
              <Link href="/case/C-004" className="btn primary">{t("home_cta_demo")} <ArrowRight size={16} /></Link>
              <Link href="/swarm" className="btn">{t("home_cta_swarm")}</Link>
            </div>
            <div className="hero-assurance"><ShieldCheck size={16} /><span>{t("home_assurance")}</span></div>
          </div>
          <div className="hero-refusal">
            <div className="hero-card-top"><span className="mono">C-017 · SALBUTAMOL</span><span className="live-label"><i /> {t("hero_live")}</span></div>
            <div className="hero-product"><span>{t("hero_prescribed")}</span><strong>{t("hero_product_name")}</strong><small>{t("hero_routes")}</small></div>
            <div className="mini-chain rejected"><span className="chain-icon"><X size={16} /></span><div><strong>{t("hero_reject_title")}</strong><p>{t("hero_reject_text")}</p><span className="rule-chip reject">P-STR-01</span></div></div>
            <div className="mini-chain unknown"><span className="chain-icon">?</span><div><strong>{t("hero_unknown_title")}</strong><p>{t("hero_unknown_text")}</p><span className="rule-chip unknown">P-REIMB-01</span></div></div>
            <div className="hero-card-bottom"><span>{t("hero_zero")}</span><Link href="/case/C-017">{t("hero_read")} <ArrowRight size={13} /></Link></div>
          </div>
        </section>
        <section className="stats-panel panel" aria-label={t("stats_aria")}>
          <StatTile value={t("stat1_value")} label={t("stat1_label")} note={t("stat1_note")} />
          <StatTile value={t("stat2_value")} label={t("stat2_label")} note={t("stat2_note")} />
          <StatTile value={t("stat3_value")} label={t("stat3_label")} note={t("stat3_note")} />
          <StatTile value={t("stat4_value")} label={t("stat4_label")} note={t("stat4_note")} />
        </section>
        <section className="proof-row">
          <div><FileCheck2 size={18} /><strong>{validCount}/30</strong><span>{t("proof_valid")}</span></div>
          <div><X size={18} /><strong>{refusalCount}</strong><span>{t("proof_refusals")}</span></div>
          <div><Braces size={18} /><strong>100%</strong><span>{t("proof_deterministic")}</span></div>
          <div><BookOpen size={18} /><strong>{lang === "en" ? "Snapshot date" : "Peildatum"}</strong><span>{t("proof_source")}</span></div>
        </section>
        <CaseExplorer items={summaries} />
        <section className="sovereignty panel">
          <div><div className="eyebrow">{t("sov_eyebrow")}</div><h2>{t("sov_h2")}</h2><p>{t("sov_p")}</p></div>
          <div className="sovereignty-steps">{[t("sov_step1"), t("sov_step2"), t("sov_step3")].map((text, index) => <div key={text}><span>{index + 1}</span><strong>{text}</strong>{index < 2 && <ArrowRight size={16} />}</div>)}</div>
          <div className="energy-note"><Check size={15} /><span>{t("energy_note")}</span></div>
        </section>
      </div>
    </div>
  );
}
