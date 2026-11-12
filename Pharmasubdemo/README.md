# Samenstelling (PharmaSub)

**Availability is solved. The work is not.** An offline-capable Next.js demonstration of *substantiated substitution chains* for Dutch medicine shortages. Rules are deterministic, every refusal stays visible, and only a named approving pharmacist can unlock a document.

All SmPC extracts, preference lists, notices, patient flags and personas are **synthetic example data — not official lists**.

## Run

```bash
npm install
npx drizzle-kit push        # creates the audit_log table in PostgreSQL
npm run dev                 # or: npm run build && npm start
```

Start at **/tour** — a ten-stop guided demo with live rule coverage.

## What was built on top of the original repo

| Area | Change |
|---|---|
| Audit trail | Moved from a JSONL file + lock file to **PostgreSQL** (Drizzle, `audit_log`), appended inside a transaction with a Postgres advisory lock, so seq numbers are gap-free under concurrency. Hash chain (canonical JSON + SHA-256), tamper demo (row 7) and reset are unchanged in behaviour. The log self-seeds with 8 verifiable demo rows. |
| Approvals | Open / generate / reject / approve rows are written **atomically** as one batch. |
| Rules that could never fire | `P-IMPORT-01` now shows a visible refusal (an EU import with no citable registration is emitted, then refused — never valid). `P-STR-02` fires for two simultaneous changes (strength + form). Both were dead code before. |
| Reimbursement | The preference lists now contain `niet_vergoed` entries, so the reimbursed-vs-not contrast is real. |
| Clinical realism | A strength change is never auto-interchangeable for narrow-therapeutic-index substances (levothyroxine, oxycodon, insuline glargine, methylfenidaat). Sertraline 25 mg carries a renal caution so the flag on C-008 has an effect. |
| Demo | New `/tour` page: scripted walkthrough + live per-rule firing counts computed from the engine. |
| Tests | 39 tests (rules coverage, pure hash-chain tests, i18n, the T-01…T-20 wall). |

`scripts/enrich-demo-data.ts` documents (and can re-apply) the data changes.

## Verify

```bash
npx vitest run
npx tsx scripts/qa.ts          # 30 cases · 20 covered (67%, see below) · rule expectations
npx tsx scripts/verify-chain.ts
```

**Coverage note:** 10 of the 30 cases must have zero valid chains (safety invariant), so at most 20/30 = 66.7% can be covered. The app reports the true 67% rather than bending the number.

## Rules (fixed precedence)

`P-SUB-01 → P-CI-01 → P-PAEDI-01 → P-STR-02 → P-STR-01 → P-IMPORT-01 → P-REIMB-01 → P-SOURCE-01`.
When the source already proves a pair non-equivalent, the more specific `P-STR-01` leads and `P-STR-02` is listed as a secondary rule. `P-NOSEND-01` is structural (nothing is ever sent); `P-SOURCE-01` is defensive and correctly never fires on the complete synthetic data.

## Stack

Next.js 16 · React 19 · strict TypeScript · plain CSS · PostgreSQL + Drizzle ORM · pdfkit · Vitest. No external runtime APIs, no LLM.
