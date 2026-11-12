import { notFound } from "next/navigation";
import { PrintView } from "@/components/PrintView";
import { getCase } from "@/domain/data";
import { buildAdvice, withApproval } from "@/domain/engine";
import { latestApproval, latestCaseSnapshot } from "@/domain/hashchain";
import { createApproval } from "@/domain/types";
import "./print.css";

export const dynamic = "force-dynamic";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCase(id) || (await latestCaseSnapshot(id));
  if (!c) notFound();
  const stored = await latestApproval(id);
  if (!stored) return <PrintView gate id={id} />;
  const base = buildAdvice(c);
  const advice = withApproval(base, createApproval(stored.chain_id, stored.by, stored.at), stored.edits);
  return <PrintView gate={false} id={id} stored={stored} advice={advice} />;
}
