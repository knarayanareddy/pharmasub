import { index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

/**
 * Append-only, hash-chained audit log. `ts` is stored as the original ISO
 * string (not a timestamp) so the SHA-256 of every row can be recomputed
 * byte-for-byte by the verifier.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    seq: integer("seq").primaryKey(),
    ts: text("ts").notNull(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    subject: text("subject").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    prevHash: text("prev_hash").notNull(),
    hash: text("hash").notNull(),
  },
  (table) => [index("audit_log_subject_idx").on(table.subject)],
);
