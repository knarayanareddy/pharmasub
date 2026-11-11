import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { getCase } from "@/domain/data";
import { buildAdvice, withApproval } from "@/domain/engine";
import { latestApproval } from "@/domain/hashchain";
import { createApproval } from "@/domain/types";
import "../case.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Casusbeoordeling" };

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id);
  if (!c) notFound();
  let advice = buildAdvice(c);
  const approval = latestApproval(id);
  if (approval && advice.chains.some((chain) => chain.chain_id === approval.chain_id && chain.status === "geldig")) {
    advice = withApproval(advice, createApproval(approval.chain_id, approval.by, approval.at), approval.edits);
  }
  const noticeText = c.notice_ref ? readFileSync(resolve(process.cwd(), "data", c.notice_ref), "utf8") : "Geen tekortmelding gekoppeld.";
  return <CaseWorkspace initialAdvice={advice} noticeText={noticeText} />;
}
