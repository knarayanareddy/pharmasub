import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import { getCase } from "@/domain/data";
import { buildAdvice, withApproval } from "@/domain/engine";
import { latestApproval, latestCaseSnapshot } from "@/domain/hashchain";
import { createApproval } from "@/domain/types";

export const runtime = "nodejs";

async function handle(request: Request, id: string) {
  const c = getCase(id) || latestCaseSnapshot(id);
  const stored = latestApproval(id);
  if (!c || !stored) return NextResponse.json({ error: "E-APPROVAL-01", message: "Een afleveradvies vereist goedkeuring door de apotheker." }, { status: 409 });
  const base = buildAdvice(c);
  if (!base.chains.some((chain) => chain.chain_id === stored.chain_id && chain.status === "geldig")) return NextResponse.json({ error: "E-APPROVAL-01", message: "De goedgekeurde keten is niet geldig." }, { status: 409 });
  const advice = withApproval(base, createApproval(stored.chain_id, stored.by, stored.at), stored.edits);
  const format = new URL(request.url).searchParams.get("format") || "pdf";
  if (format === "json") return NextResponse.json(advice, { headers: { "Content-Disposition": `attachment; filename="${id}-afleveradvies.json"` } });
  if (format !== "pdf") return NextResponse.json({ error: "E-FORMAT-01" }, { status: 400 });
  const pdf = new PDFDocument({ size: "A4", margin: 52, info: { Title: `${id} afleveradvies`, Author: stored.by, Subject: "Synthetische demonstratie" } });
  const chunks: Buffer[] = [];
  pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => pdf.on("end", () => resolve(Buffer.concat(chunks))));
  pdf.fontSize(20).fillColor("#14202b").text("Samenstelling", { continued: false });
  pdf.moveDown(.3).fontSize(9).fillColor("#5c6b78").text("AFLEVERADVIES · SYNTHETISCHE DEMONSTRATIE");
  pdf.moveDown(1.5).fontSize(15).fillColor("#14202b").text(`${id} · ${c.substance}`);
  pdf.moveDown(.5).fontSize(10).text(`Goedgekeurd door: ${stored.by}\nDatum: ${stored.at}\nKeten: ${stored.chain_id}`);
  pdf.moveDown(1.5).fontSize(14).fillColor("#146c4a").text("Uitleg voor de patient");
  pdf.moveDown(.5).fontSize(11).fillColor("#14202b").text(advice.patient_text_nl, { lineGap: 5 });
  pdf.moveDown(1.5).fontSize(14).fillColor("#1f4e79").text("Bericht aan de huisarts");
  pdf.moveDown(.5).fontSize(10).fillColor("#14202b").text(advice.gp_message_nl, { lineGap: 4 });
  pdf.moveDown(1.5).fontSize(8).fillColor("#5c6b78").text("Demo - synthetische casussen. Geen echte patientgegevens. Geen medisch advies. Dit systeem heeft niets verzonden en verricht geen aflevering. Preferentiedata zijn voorbeelddata en geen officiele lijst.");
  pdf.end();
  const buffer = await done;
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${id}-afleveradvies.pdf"` } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return handle(request, (await params).id); }
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return handle(request, (await params).id); }
