"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import type { SubstitutionAdvice } from "@/domain/types";
import { useLang } from "@/i18n/LanguageProvider";
import {
  translateAtc,
  translateForm,
  translatePackage,
  translateProduct,
  translateRoute,
  translateSourceDoc,
  translateStrength,
  translateSubstance,
} from "@/i18n/translateData";
import { PrintButton } from "@/app/case/[id]/print/PrintButton";

type PrintProps =
  | { gate: true; id: string }
  | {
      gate: false;
      id: string;
      stored: { chain_id: string; by: string; at: string };
      advice: SubstitutionAdvice;
    };

export function PrintView(props: PrintProps) {
  const { lang, t } = useLang();
  if (props.gate) {
    return (
      <div className="page print-gate">
        <div className="panel panel-body">
          <LockKeyhole size={28} />
          <h1>{t("gate_h1")}</h1>
          <p>{t("gate_p", { id: props.id })}</p>
          <p className="mono">E-APPROVAL-01</p>
          <Link href={`/case/${props.id}`} className="btn primary"><ArrowLeft size={14} />{t("gate_back")}</Link>
        </div>
      </div>
    );
  }
  const { id, stored, advice } = props;
  const c = advice.case;
  const chain = advice.chains.find((item) => item.chain_id === stored.chain_id)!;
  const link = chain.chain[0];
  const patientBody = lang === "en" ? (advice.patient_text_en || advice.patient_text_nl) : advice.patient_text_nl;
  const gpBody = lang === "en" ? (advice.gp_message_en || advice.gp_message_nl) : advice.gp_message_nl;
  return (
    <div className="page print-page">
      <div className="print-toolbar no-print">
        <Link href={`/case/${id}`} className="btn"><ArrowLeft size={14} />{t("print_back")}</Link>
        <span>{t("print_note")}</span>
        <PrintButton />
      </div>
      <article className="a4-document">
        <header className="document-header">
          <div><strong>samenstelling</strong><span>{t("print_header_sub")}</span></div>
          <div className="document-case"><strong>{id}</strong><span>{new Date(stored.at).toLocaleDateString(lang === "en" ? "en-GB" : "nl-NL")}</span></div>
        </header>
        <section className="document-approval">
          <ShieldCheck size={20} />
          <div>
            <strong>{t("print_approved_by", { by: stored.by })}</strong>
            <span>{t("print_approved_sub", { chainId: stored.chain_id })}</span>
          </div>
        </section>
        <section className="document-patient">
          <div className="document-section-label">{t("print_patient_label")}</div>
          <h1>{t("print_patient_h1")}</h1>
          <p>{patientBody}</p>
          <div className="document-no-dose">{t("print_no_dose")}</div>
        </section>
        <section className="document-professional">
          <div className="document-section-label">{t("print_prof_label")}</div>
          <div className="document-facts">
            <div><span>{t("print_active_substance")}</span><strong>{translateSubstance(c.substance, lang)} · {translateAtc(c.atc, lang)}</strong></div>
            <div><span>{t("print_chosen_product")}</span><strong>{translateProduct(link.product, lang)}</strong></div>
            <div><span>{t("print_strength_form")}</span><strong>{translateStrength(link.strength, lang)} · {translateForm(link.form, lang)}</strong></div>
            <div><span>{t("print_pkg_route")}</span><strong>{translatePackage(link.package, lang)} · {translateRoute(link.route, lang)}</strong></div>
          </div>
          <div className="document-rules">{chain.rules_passed.map((rule) => <span key={rule}>{rule}</span>)}</div>
          <p className="document-source">{t("print_source_prefix")}: {translateSourceDoc(link.source.doc, lang)} · {t("print_snapshot_date")} {link.source.date} · SHA-256 {link.source.sha256}</p>
        </section>
        <section className="document-gp">
          <div className="document-section-label">{t("print_gp_label")}</div>
          <p>{gpBody}</p>
        </section>
        <footer className="document-footer"><span>{t("footer_text")}</span><span>{t("print_footer_nosend")}</span></footer>
      </article>
    </div>
  );
}
