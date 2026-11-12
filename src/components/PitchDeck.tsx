"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  FileCheck2,
  LockKeyhole,
  Play,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildAdvice } from "@/domain/engine";
import { RULES, RULES_EN, type RuleId } from "@/domain/rules";
import type { Case } from "@/domain/types";
import { useLang } from "@/i18n/LanguageProvider";
import { translateForm, translateProduct, translateStrength, translateSubstance } from "@/i18n/translateData";

type ProblemScenario = "same" | "form" | "hard";
type SimScenario = "ok" | "paed" | "therapy";
type SimInsurer = "CZ" | "onbekend";

const STEP_MINUTES: Record<ProblemScenario, [number, number, number, number, number, number]> = {
  same: [2, 4, 2, 6, 0, 6],
  form: [2, 6, 6, 7, 0, 9],
  hard: [2, 8, 7, 8, 7, 13],
};

const ALL_RULES: RuleId[] = [
  "P-SUB-01",
  "P-CI-01",
  "P-PAEDI-01",
  "P-STR-02",
  "P-STR-01",
  "P-IMPORT-01",
  "P-REIMB-01",
  "P-SOURCE-01",
];

export function PitchDeck({
  step,
  onStepChange,
}: {
  step: 0 | 1 | 2;
  onStepChange: (next: 0 | 1 | 2) => void;
}) {
  const { lang, t } = useLang();
  const [problemScenario, setProblemScenario] = useState<ProblemScenario>("form");
  const [activeFriction, setActiveFriction] = useState<number>(3);
  const [simScenario, setSimScenario] = useState<SimScenario>("ok");
  const [simInsurer, setSimInsurer] = useState<SimInsurer>("CZ");
  const [inspectedRule, setInspectedRule] = useState<RuleId>("P-REIMB-01");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (step < 2 && event.key === "ArrowRight") onStepChange((step + 1) as 0 | 1 | 2);
      if (step > 0 && step <= 2 && event.key === "ArrowLeft") onStepChange((step - 1) as 0 | 1 | 2);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onStepChange]);

  const minutes = STEP_MINUTES[problemScenario];
  const totalMinutes = minutes.reduce((sum, n) => sum + n, 0);
  const stepLabels = [
    t("s1_step_stock"),
    t("s1_step_ci"),
    t("s1_step_str"),
    t("s1_step_reimb"),
    t("s1_step_import"),
    t("s1_step_docs"),
  ];

  const simCase: Case = useMemo(() => {
    if (simScenario === "paed") {
      return {
        case_id: "DEMO-PAED",
        substance: "oxycodon",
        atc: "N02AA05",
        strength: "5 mg",
        form: "capsule",
        package: "30 capsules",
        patient_flags: ["pediatrisch"],
        insurer: simInsurer,
        notice_ref: null,
        age_band: "0-11",
      };
    }
    return {
      case_id: "DEMO-RX",
      substance: "salbutamol",
      atc: "R03AC02",
      strength: "100 mcg",
      form: "inhalatiepoeder",
      package: "200 doses",
      patient_flags: [],
      insurer: simInsurer,
      notice_ref: null,
      age_band: "18-64",
      ...(simScenario === "therapy" ? { therapeutic_need: true } : {}),
    };
  }, [simScenario, simInsurer]);

  const advice = useMemo(() => buildAdvice(simCase), [simCase]);
  const validChains = advice.chains.filter((item) => item.status === "geldig");
  const primaryRefusal = advice.refusals[0];
  const rejectedRules = new Set(advice.refusals.map((item) => item.reject_rule).filter(Boolean));
  const passedRules = new Set(advice.chains.flatMap((item) => item.rules_passed));

  return (
    <section className={`deck-shell ${step === 2 ? "is-compact" : ""}`} aria-label={t("deck_aria")}>
      <div className="deck-nav">
        <div className="deck-steps" role="tablist" aria-label={t("deck_aria")}>
          <button
            type="button"
            role="tab"
            aria-selected={step === 0}
            className={`deck-step ${step === 0 ? "active" : step > 0 ? "done" : ""}`}
            onClick={() => onStepChange(0)}
          >
            <span className="mono">01</span>
            <strong>{t("deck_step1")}</strong>
          </button>
          <span className="deck-sep" aria-hidden="true" />
          <button
            type="button"
            role="tab"
            aria-selected={step === 1}
            className={`deck-step ${step === 1 ? "active" : step > 1 ? "done" : ""}`}
            onClick={() => onStepChange(1)}
          >
            <span className="mono">02</span>
            <strong>{t("deck_step2")}</strong>
          </button>
          <span className="deck-sep" aria-hidden="true" />
          <button
            type="button"
            role="tab"
            aria-selected={step === 2}
            className={`deck-step ${step === 2 ? "active" : ""}`}
            onClick={() => onStepChange(2)}
          >
            <span className="mono">03</span>
            <strong>{t("deck_step3")}</strong>
          </button>
        </div>
        {step < 2 ? (
          <button type="button" className="btn small ghost deck-skip" onClick={() => onStepChange(2)}>
            {t("deck_skip")} <ArrowRight size={13} />
          </button>
        ) : (
          <button type="button" className="btn small" onClick={() => onStepChange(0)}>
            <ArrowLeft size={13} /> {t("deck_back_slides")}
          </button>
        )}
      </div>

      {step === 0 && (
        <article className="slide-card panel" aria-label={t("s1_eyebrow")}>
          <div className="slide-grid">
            <div className="slide-story">
              <div className="eyebrow">{t("s1_eyebrow")}</div>
              <h1 className="slide-title">
                {t("s1_h1a")}
                <br />
                <em>{t("s1_h1b")}</em>
              </h1>
              <p className="slide-lead">{t("s1_lead")}</p>

              <div className="slide-metrics-mini">
                <div>
                  <strong className="mono">{t("stat1_value")}</strong>
                  <span>{t("stat1_label")}</span>
                  <small>{t("stat1_note")}</small>
                </div>
                <div>
                  <strong className="mono">{t("stat2_value")}</strong>
                  <span>{t("stat2_label")}</span>
                  <small>{t("stat2_note")}</small>
                </div>
                <div>
                  <strong className="mono">{t("stat3_value")}</strong>
                  <span>{t("stat3_label")}</span>
                  <small>{t("stat3_note")}</small>
                </div>
                <div>
                  <strong className="mono">{t("stat4_value")}</strong>
                  <span>{t("stat4_label")}</span>
                  <small>{t("stat4_note")}</small>
                </div>
              </div>

              <div className="slide-gap-box">
                <div className="section-kicker">{t("s1_gap_title")}</div>
                <div className="gap-row solved">
                  <span>{t("s1_gap_search_label")}</span>
                  <strong className="mono">{t("s1_gap_search_val")}</strong>
                </div>
                <div className="gap-row bottleneck">
                  <span>{t("s1_gap_work_label")}</span>
                  <strong className="mono">{t("s1_gap_work_val")}</strong>
                </div>
              </div>
            </div>

            <div className="slide-interactive">
              <div className="sim-head">
                <div>
                  <span className="sim-kicker mono">{t("s1_calc_title")}</span>
                  <small>{t("s1_calc_sub")}</small>
                </div>
                <Clock3 size={16} />
              </div>

              <div className="scenario-pills" role="group" aria-label={t("s1_calc_title")}>
                {([
                  ["same", t("s1_scen_same")],
                  ["form", t("s1_scen_form")],
                  ["hard", t("s1_scen_hard")],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={problemScenario === key ? "active" : ""}
                    onClick={() => setProblemScenario(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="friction-list">
                {stepLabels.map((label, idx) => {
                  const mins = minutes[idx];
                  const maxBar = 40;
                  const pct = Math.min(100, Math.round((mins / maxBar) * 100) * 3);
                  return (
                    <button
                      type="button"
                      key={label}
                      className={`friction-row ${activeFriction === idx ? "active" : ""} ${mins === 0 ? "dim" : ""}`}
                      onClick={() => setActiveFriction(idx)}
                    >
                      <div className="friction-top">
                        <span>{label}</span>
                        <strong className="mono">{mins} min</strong>
                      </div>
                      <div className="friction-bar">
                        <i className={idx === 0 ? "solved" : "work"} style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="friction-detail">{t(`s1_detail_${activeFriction}`)}</div>

              <div className="calc-summary">
                <div>
                  <span className="mono bad">{t("s1_calc_total", { n: totalMinutes })}</span>
                  <span className="mono good">{t("s1_calc_with")}</span>
                </div>
                <p>{t("s1_calc_note")}</p>
              </div>
            </div>
          </div>

          <footer className="slide-footer">
            <span className="mono tiny">{t("deck_slide_of", { n: 1 })}</span>
            <div className="slide-actions">
              <button type="button" className="btn primary" onClick={() => onStepChange(1)}>
                {t("deck_next")} <ArrowRight size={15} />
              </button>
            </div>
          </footer>
        </article>
      )}

      {step === 1 && (
        <article className="slide-card panel" aria-label={t("s2_eyebrow")}>
          <div className="slide-grid">
            <div className="slide-story">
              <div className="eyebrow">{t("s2_eyebrow")}</div>
              <h1 className="slide-title">
                {t("s2_h1a")}
                <br />
                <em>{t("s2_h1b")}</em>
              </h1>
              <p className="slide-lead">{t("s2_lead")}</p>

              <div className="pillar-list">
                <div className="pillar-item">
                  <FileCheck2 size={18} />
                  <div>
                    <strong>{t("s2_p1_title")}</strong>
                    <p>{t("s2_p1_text")}</p>
                  </div>
                </div>
                <div className="pillar-item">
                  <ShieldAlert size={18} />
                  <div>
                    <strong>{t("s2_p2_title")}</strong>
                    <p>{t("s2_p2_text")}</p>
                  </div>
                </div>
                <div className="pillar-item">
                  <LockKeyhole size={18} />
                  <div>
                    <strong>{t("s2_p3_title")}</strong>
                    <p>{t("s2_p3_text")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="slide-interactive dark-gate">
              <div className="sim-head">
                <div>
                  <span className="sim-kicker mono">{t("s2_sim_title")}</span>
                  <small>{t("s2_sim_sub")}</small>
                </div>
                <ShieldCheck size={16} />
              </div>

              <div className="sim-rx-banner mono">
                {translateSubstance(simCase.substance, lang)} · {translateStrength(simCase.strength, lang)} · {translateForm(simCase.form, lang)}
              </div>

              <div className="sim-controls">
                <div>
                  <span className="sim-label">{t("s2_sim_case")}</span>
                  <div className="scenario-pills dark">
                    {([
                      ["ok", t("s2_sim_sub_ok")],
                      ["paed", t("s2_sim_sub_paed")],
                      ["therapy", t("s2_sim_sub_ther")],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={simScenario === key ? "active" : ""}
                        onClick={() => setSimScenario(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="sim-label">{t("s2_sim_insurer")}</span>
                  <div className="scenario-pills dark">
                    {([
                      ["CZ", t("s2_sim_ins_cz")],
                      ["onbekend", t("s2_sim_ins_unk")],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={simInsurer === key ? "active" : ""}
                        onClick={() => setSimInsurer(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rule-pipeline" aria-label={t("s2_sim_title")}>
                {ALL_RULES.map((ruleId) => {
                  const isRejected = rejectedRules.has(ruleId);
                  const isPassed = passedRules.has(ruleId);
                  const tone = isRejected ? "reject" : isPassed ? "pass" : "skip";
                  const ruleText = lang === "en" ? RULES_EN[ruleId] : RULES[ruleId];
                  return (
                    <button
                      type="button"
                      key={ruleId}
                      className={`pipe-chip ${tone} ${inspectedRule === ruleId ? "selected" : ""}`}
                      title={ruleText}
                      onClick={() => setInspectedRule(ruleId)}
                    >
                      <span className="mono">{ruleId}</span>
                      {tone === "reject" ? <X size={11} /> : tone === "pass" ? <Check size={11} /> : <span>·</span>}
                    </button>
                  );
                })}
              </div>
              <div className="pipe-detail">
                <strong className="mono">{inspectedRule}</strong>
                <span>{lang === "en" ? RULES_EN[inspectedRule] : RULES[inspectedRule]}</span>
              </div>

              <div className="sim-outcome-row">
                <div className={`sim-count ${validChains.length > 0 ? "valid" : "zero"}`}>
                  <Check size={14} />
                  <strong>{t("s2_sim_valid", { n: validChains.length })}</strong>
                  {validChains[0] && <span>{translateProduct(validChains[0].chain[0].product, lang)}</span>}
                </div>
                <div className="sim-count refused">
                  <AlertTriangle size={14} />
                  <strong>{t("s2_sim_refused", { n: advice.refusals.length })}</strong>
                </div>
              </div>

              {primaryRefusal && (
                <div className="sim-refusal-box">
                  <div className="sim-refusal-top">
                    <span>{t("s2_sim_first_refusal")}</span>
                    <span className="mono">{primaryRefusal.reject_rule}</span>
                  </div>
                  <p>
                    {lang === "en" && primaryRefusal.reject_reason_en
                      ? primaryRefusal.reject_reason_en
                      : primaryRefusal.reject_reason_nl}
                  </p>
                </div>
              )}

              <div className="sim-deep-links">
                <Link href="/case/C-004">{t("s2_sim_open_c004")} <ArrowRight size={12} /></Link>
                <Link href="/case/C-017">{t("s2_sim_open_c017")} <ArrowRight size={12} /></Link>
              </div>
            </div>
          </div>

          <footer className="slide-footer">
            <button type="button" className="btn" onClick={() => onStepChange(0)}>
              <ArrowLeft size={15} /> {t("deck_prev")}
            </button>
            <span className="mono tiny">{t("deck_slide_of", { n: 2 })}</span>
            <div className="slide-actions">
              <button type="button" className="btn primary" onClick={() => onStepChange(2)}>
                <Play size={14} /> {t("deck_start_demo")} <ArrowRight size={15} />
              </button>
            </div>
          </footer>
        </article>
      )}
    </section>
  );
}
