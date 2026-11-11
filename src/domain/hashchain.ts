import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, openSync, closeSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { AuditRow } from "./types";

export const AUDIT_PATH = resolve(process.cwd(), "logs/audit.jsonl");
const GENESIS = "0".repeat(64);

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}

export function hashRow(row: Omit<AuditRow, "hash"> | AuditRow): string {
  const body = { seq: row.seq, ts: row.ts, actor: row.actor, action: row.action, subject: row.subject, payload: row.payload, prev_hash: row.prev_hash };
  return createHash("sha256").update(canonicalJson(body)).digest("hex");
}

export function readAudit(path = AUDIT_PATH): AuditRow[] {
  if (!existsSync(/*turbopackIgnore: true*/ path)) return [];
  const text = readFileSync(/*turbopackIgnore: true*/ path, "utf8").trim();
  return text ? text.split("\n").map((line) => JSON.parse(line) as AuditRow) : [];
}

function writeAudit(rows: AuditRow[], path = AUDIT_PATH): void {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  writeFileSync(temp, rows.length ? `${rows.map((row) => JSON.stringify(row)).join("\n")}\n` : "");
  writeFileSync(path, readFileSync(temp));
  unlinkSync(temp);
}

export function verifyAudit(path = AUDIT_PATH): { total: number; verified: number; brokenAt: number | null } {
  const rows = readAudit(path);
  let previous = GENESIS;
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (row.seq !== index + 1 || row.prev_hash !== previous || hashRow(row) !== row.hash) {
      return { total: rows.length, verified: index, brokenAt: index + 1 };
    }
    previous = row.hash;
  }
  return { total: rows.length, verified: rows.length, brokenAt: null };
}

export function appendAudit(input: Pick<AuditRow, "actor" | "action" | "subject" | "payload"> & { ts?: string }, path = AUDIT_PATH): AuditRow {
  mkdirSync(dirname(path), { recursive: true });
  const lock = `${path}.lock`;
  let lockFd: number | null = null;
  for (let attempt = 0; attempt < 100 && lockFd === null; attempt++) {
    try { lockFd = openSync(lock, "wx"); } catch {
      const until = Date.now() + 5;
      while (Date.now() < until) { /* short local demo lock */ }
    }
  }
  if (lockFd === null) throw new Error("Auditbestand is tijdelijk vergrendeld");
  try {
    const rows = readAudit(path);
    const previous = rows.at(-1);
    const body: Omit<AuditRow, "hash"> = {
      seq: (previous?.seq || 0) + 1,
      ts: input.ts || new Date().toISOString(),
      actor: input.actor,
      action: input.action,
      subject: input.subject,
      payload: input.payload,
      prev_hash: previous?.hash || GENESIS,
    };
    const row = { ...body, hash: hashRow(body) };
    writeAudit([...rows, row], path);
    return row;
  } finally {
    closeSync(lockFd);
    unlinkSync(lock);
  }
}

export function resetDemoAudit(path = AUDIT_PATH): AuditRow[] {
  if (existsSync(/*turbopackIgnore: true*/ path)) writeFileSync(path, "");
  const actions: AuditRow["action"][] = ["DEMO_RESET", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED"];
  for (let index = 0; index < actions.length; index++) {
    appendAudit({
      ts: `2026-11-${String(10 + Math.floor(index / 4)).padStart(2, "0")}T${String(8 + index).padStart(2, "0")}:00:00.000Z`,
      actor: "synthetische-demo", action: actions[index], subject: index === 0 ? "audit" : `C-${String(index).padStart(3, "0")}`,
      payload: { synthetic: true, note: "Controleerbare demonstratiegebeurtenis" },
    }, path);
  }
  return readAudit(path);
}

export function tamperRowSeven(path = AUDIT_PATH): void {
  let rows = readAudit(path);
  if (rows.length < 7) rows = resetDemoAudit(path);
  rows[6] = { ...rows[6], payload: { ...rows[6].payload, note: "AANGEPAST ZONDER NIEUWE HASH" } };
  writeAudit(rows, path);
}

export function latestCaseSnapshot(caseId: string, path = AUDIT_PATH): import("./types").Case | null {
  if (verifyAudit(path).brokenAt !== null) return null;
  const row = readAudit(path).findLast((item) => item.subject === caseId && item.action === "CHAIN_APPROVED" && item.payload.case_snapshot);
  return row ? row.payload.case_snapshot as import("./types").Case : null;
}

export function latestApproval(caseId: string, path = AUDIT_PATH): { chain_id: string; by: string; at: string; edits: import("./types").Edit[] } | null {
  if (verifyAudit(path).brokenAt !== null) return null;
  const relevant = readAudit(path).filter((row) => row.subject === caseId && (row.action === "CHAIN_APPROVED" || row.action === "EDIT_MADE"));
  const approval = relevant.findLast((row) => row.action === "CHAIN_APPROVED");
  if (!approval) return null;
  const edits = relevant.filter((row) => row.action === "EDIT_MADE" && row.seq > approval.seq).map((row) => row.payload.edit as import("./types").Edit);
  return {
    chain_id: String(approval.payload.chain_id), by: String(approval.payload.by), at: String(approval.payload.at), edits,
  };
}
