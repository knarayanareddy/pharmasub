import { createHash } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import type { AuditRow, Case, Edit } from "./types";

export const GENESIS = "0".repeat(64);
export type AuditVerification = { total: number; verified: number; brokenAt: number | null };
type AuditInput = Pick<AuditRow, "actor" | "action" | "subject" | "payload"> & { ts?: string };

/* ───────────── pure helpers (no I/O, usable in tests and scripts) ───────────── */

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

export function chainRow(previous: AuditRow | undefined, input: AuditInput): AuditRow {
  const body: Omit<AuditRow, "hash"> = {
    seq: (previous?.seq || 0) + 1,
    ts: input.ts || new Date().toISOString(),
    actor: input.actor,
    action: input.action,
    subject: input.subject,
    payload: JSON.parse(JSON.stringify(input.payload)) as Record<string, unknown>,
    prev_hash: previous?.hash || GENESIS,
  };
  return { ...body, hash: hashRow(body) };
}

export function verifyRows(rows: AuditRow[]): AuditVerification {
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

export function demoSeedInputs(): AuditInput[] {
  const actions: AuditRow["action"][] = ["DEMO_RESET", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED", "CASE_OPENED"];
  return actions.map((action, index) => ({
    ts: `2026-11-${String(10 + Math.floor(index / 4)).padStart(2, "0")}T${String(8 + index).padStart(2, "0")}:00:00.000Z`,
    actor: "synthetische-demo",
    action,
    subject: index === 0 ? "audit" : `C-${String(index).padStart(3, "0")}`,
    payload: { synthetic: true, note: "Controleerbare demonstratiegebeurtenis" },
  }));
}

/* ───────────── PostgreSQL-backed store ───────────── */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const LOCK_KEY = 7_450_001; // advisory lock id for the audit chain

const toRow = (r: typeof auditLog.$inferSelect): AuditRow => ({
  seq: r.seq, ts: r.ts, actor: r.actor, action: r.action as AuditRow["action"], subject: r.subject, payload: r.payload, prev_hash: r.prevHash, hash: r.hash,
});

async function readTx(tx: Tx | typeof db): Promise<AuditRow[]> {
  return (await tx.select().from(auditLog).orderBy(asc(auditLog.seq))).map(toRow);
}

async function insertTx(tx: Tx, input: AuditInput): Promise<AuditRow> {
  const [last] = await tx.select().from(auditLog).orderBy(sql`${auditLog.seq} desc`).limit(1);
  const row = chainRow(last ? toRow(last) : undefined, input);
  await tx.insert(auditLog).values({ seq: row.seq, ts: row.ts, actor: row.actor, action: row.action, subject: row.subject, payload: row.payload, prevHash: row.prev_hash, hash: row.hash });
  return row;
}

async function lockedTx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${LOCK_KEY})`);
    return fn(tx);
  });
}

/** First visit: the log starts with eight synthetic, verifiable demo events. */
export async function ensureAuditSeeded(): Promise<void> {
  await lockedTx(async (tx) => {
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(auditLog);
    if (n === 0) for (const input of demoSeedInputs()) await insertTx(tx, input);
  });
}

export async function readAudit(): Promise<AuditRow[]> {
  await ensureAuditSeeded();
  return readTx(db);
}

export async function verifyAudit(): Promise<AuditVerification> {
  return verifyRows(await readAudit());
}

export async function appendAudit(input: AuditInput): Promise<AuditRow> {
  await ensureAuditSeeded();
  return lockedTx((tx) => insertTx(tx, input));
}

/** Append several rows atomically (all or nothing, strictly consecutive seq). */
export async function appendAuditBatch(inputs: AuditInput[]): Promise<AuditRow[]> {
  await ensureAuditSeeded();
  return lockedTx(async (tx) => {
    const rows: AuditRow[] = [];
    for (const input of inputs) rows.push(await insertTx(tx, input));
    return rows;
  });
}

export async function resetDemoAudit(): Promise<AuditRow[]> {
  return lockedTx(async (tx) => {
    await tx.delete(auditLog);
    for (const input of demoSeedInputs()) await insertTx(tx, input);
    return readTx(tx);
  });
}

/** Demo only: edit row 7 behind the chain's back so the verifier can catch it. */
export async function tamperRowSeven(): Promise<void> {
  const rows = await readAudit();
  if (rows.length < 7) await resetDemoAudit();
  const [row] = await db.select().from(auditLog).where(eq(auditLog.seq, 7));
  await db.update(auditLog).set({ payload: { ...row.payload, note: "AANGEPAST ZONDER NIEUWE HASH" } }).where(eq(auditLog.seq, 7));
}

export async function latestCaseSnapshot(caseId: string): Promise<Case | null> {
  const rows = await readAudit();
  if (verifyRows(rows).brokenAt !== null) return null;
  const row = rows.findLast((item) => item.subject === caseId && item.action === "CHAIN_APPROVED" && item.payload.case_snapshot);
  return row ? (row.payload.case_snapshot as Case) : null;
}

export async function latestApproval(caseId: string): Promise<{ chain_id: string; by: string; at: string; edits: Edit[] } | null> {
  const rows = await readAudit();
  if (verifyRows(rows).brokenAt !== null) return null;
  const relevant = rows.filter((row) => row.subject === caseId && (row.action === "CHAIN_APPROVED" || row.action === "EDIT_MADE"));
  const approval = relevant.findLast((row) => row.action === "CHAIN_APPROVED");
  if (!approval) return null;
  const edits = relevant.filter((row) => row.action === "EDIT_MADE" && row.seq > approval.seq).map((row) => row.payload.edit as Edit);
  return { chain_id: String(approval.payload.chain_id), by: String(approval.payload.by), at: String(approval.payload.at), edits };
}
