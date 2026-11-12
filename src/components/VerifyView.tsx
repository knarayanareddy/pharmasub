"use client";

import { Braces, FileJson, KeyRound, ShieldCheck } from "lucide-react";
import { AuditExplorer } from "@/components/AuditExplorer";
import type { AuditRow } from "@/domain/types";
import { RULES, RULES_EN, type RuleId } from "@/domain/rules";
import { useLang } from "@/i18n/LanguageProvider";

interface AuditState {
  total: number;
  verified: number;
  brokenAt: number | null;
  rows: AuditRow[];
}

export function VerifyView({ initial }: { initial: AuditState }) {
  const { lang, t } = useLang();
  return (
    <div className="page verify-page">
      <div className="verify-heading">
        <div>
          <div className="eyebrow">{t("verify_eyebrow")}</div>
          <h1 className="page-title">{t("verify_h1")}</h1>
          <p className="page-intro">{t("verify_intro")}</p>
        </div>
        <div className="audit-seal"><ShieldCheck size={25} /><span>SHA-256</span><small>hash-chained JSONL</small></div>
      </div>
      <AuditExplorer initial={initial} />
      <section className="rules-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{t("rules_eyebrow")}</div>
            <h2>{t("rules_h2")}</h2>
          </div>
          <span className="mono tiny">{t("rules_precedence")}</span>
        </div>
        <div className="rules-grid">
          {Object.entries(RULES).map(([id, label], index) => (
            <div className="rule-row" key={id}>
              <span className="mono rule-order">{String(index + 1).padStart(2, "0")}</span>
              <span className="rule-chip">{id}</span>
              <div><strong>{lang === "en" ? RULES_EN[id as RuleId] : label}</strong></div>
            </div>
          ))}
        </div>
      </section>
      <section className="verification-explainer">
        <div><KeyRound size={20} /><h3>{t("exp1_h")}</h3><p>{t("exp1_p")}</p><span className="mono">canonicalJson(row)</span></div>
        <div><Braces size={20} /><h3>{t("exp2_h")}</h3><p>{t("exp2_p")}</p><span className="mono">sha256(canonicalJson)</span></div>
        <div><FileJson size={20} /><h3>{t("exp3_h")}</h3><p>{t("exp3_p")}</p><span className="mono">npx tsx scripts/verify-chain.ts</span></div>
      </section>
    </div>
  );
}
