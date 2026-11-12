import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { getCase } from "@/domain/data";
import { buildAdvice, withApproval } from "@/domain/engine";
import { latestApproval } from "@/domain/hashchain";
import { createApproval } from "@/domain/types";
import { getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import "../case.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).meta_case };
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) notFound();
  let advice = buildAdvice(c);
  const approval = await latestApproval(id);
  if (approval && advice.chains.some((chain) => chain.chain_id === approval.chain_id && chain.status === "geldig")) {
    advice = withApproval(advice, createApproval(approval.chain_id, approval.by, approval.at), approval.edits);
  }
  const noticeText = c.notice_ref ? readFileSync(resolve(process.cwd(), "data", c.notice_ref), "utf8") : "";
  return <CaseWorkspace initialAdvice={advice} noticeText={noticeText} />;
}
