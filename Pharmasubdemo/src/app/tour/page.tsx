import type { Metadata } from "next";
import { TourView, type RuleStat } from "@/components/TourView";
import { cases } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";
import { RULES } from "@/domain/rules";
import { readAudit, verifyRows } from "@/domain/hashchain";
import { getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import "./tour.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).meta_tour };
}

export default async function TourPage() {
  const counts = new Map<string, { count: number; example: string }>();
  let valid = 0;
  let refused = 0;
  let covered = 0;
  for (const c of cases) {
    const advice = buildAdvice(c);
    const validHere = advice.chains.filter((chain) => chain.status === "geldig").length;
    valid += validHere;
    if (validHere) covered++;
    for (const chain of advice.refusals) {
      refused++;
      for (const rule of [chain.reject_rule, ...chain.secondary_rules]) {
        if (!rule) continue;
        const entry = counts.get(rule) || { count: 0, example: c.case_id };
        entry.count++;
        counts.set(rule, entry);
      }
    }
  }
  const rules: RuleStat[] = Object.keys(RULES).map((rule) => ({ rule, count: counts.get(rule)?.count || 0, example: counts.get(rule)?.example || null }));
  const audit = verifyRows(await readAudit());
  return <TourView rules={rules} totals={{ cases: cases.length, covered, valid, refused }} audit={audit} />;
}
