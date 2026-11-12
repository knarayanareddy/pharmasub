# End-to-end review: `build-pharmacy.md` vs. the built repo

**Date:** 2026-11-11 · **Branch:** `arena/0cb863c4-pharmasub` (from `f8d2f4e`) · **Reviewer method:** read every spec section, read every source file, ran the full verification suite, and exercised the running app over HTTP (all routes, approve → export → tamper → reset, swarm ensemble, survey CSVs).

## Verdict

**Yes — the repo is built to the spec.** The safety core (permanent refusal column, `onbekend` as a first-class answer, deterministic rule gate with precedence, branded pharmacist approval, hash-chained audit, pre-committed falsifiers) is implemented faithfully and verified live. `npm run build`, `npm run typecheck`, `npm test` (20/20), `npm run qa`, and `npx tsx scripts/verify-chain.ts` all pass.

The gaps are concentrated in three places: **three rules can never fire in the demo data**, **the reimbursement data has no negative examples**, and **a handful of spec assertions are self-contradictory or literally unpassable** (the implementation chose the safer reading in each case and is right to do so). Details below, ranked by importance.

---

## 1. What was verified live (all green)

| Check | Result |
|---|---|
| `npm run build` / `typecheck` / `test` / `qa` / `verify-chain` | ✅ 0 errors · 20/20 tests · 30 cases, 20 covered, 62 valid chains, 25 refusals · `{total:8, verified:8, brokenAt:null}` |
| All routes HTTP 200 (`/`, `/case/C-004`, `/case/C-017`, `/case/C-004/print`, `/verify`, `/swarm`, `/instrument`, `/intake`) | ✅ |
| Refusal column visible at first paint, no interaction (A4) | ✅ C-004: 2 refusals · C-017: 4 refusals (`data-refusal` in server HTML) |
| Every rendered field carries `data-source` + `data-date` (A12/T-12) | ✅ |
| No nested anchors (A3) | ✅ 0 on all pages |
| Export without approval → 409 `E-APPROVAL-01` (A7/T-10) | ✅ both `?format=json` and `?format=pdf` |
| Approve → export → tamper → reset (A8/T-16) | ✅ approve logs `CASE_OPENED, CHAINS_GENERATED, CHAIN_REJECTED×2, CHAIN_APPROVED`; tamper → `brokenAt: 7` **and export is then blocked (409)**; reset → `brokenAt: null` |
| `POST /api/chain` writes nothing (T-13) | ✅ `X-Audit-Write: false`, audit file byte-identical |
| Swarm determinism | ✅ committed `data/swarm/runs.json` ≡ live `/api/swarm` ensemble, all 6 frequencies identical |
| Honesty block (A10) | ✅ `GEEN LLM · SYNTHETISCH · GEEN VOORSPELLING · PRIOREN ZIJN AANNAMES` on `/swarm` |
| Falsifiers fired (A11) | ✅ 2 of 5 fired (F4 GP-message 0/200, F5 divergence 0.182 < 0.25) — reported, not hidden |
| GP message ≤ 120 words (§2) | ✅ 70 words · patient text 55 words, no dosing advice |
| No external URLs, no runtime API, fonts self-hosted (A13) | ✅ `fetch` only to `/api/*`; service worker caches visited pages |
| Swarm isolation (T-17 intent) | ✅ clinical routes (`case/chain/approve`) import no swarm code; only `/api/swarm`, `/api/survey`, `/swarm`, `/instrument` do |
| No forbidden claims (§14.3) | ✅ no "clinically validated", no reimbursement guarantee, no "not a medical device" |

Actual ensemble results (computed, **not** forced to the spec's illustrative 78/200): QREFUSE 200/200, QHOPS 161/200, QPAYER 48/200, QGP 0/200, QUNKNOWN 184/200, QFOUT 199/200, divergence 0.182.

---

## 2. Gaps — ranked

### 🔴 1. Three rules never fire in the demo (87 chains checked: P-STR-02 ×0, P-IMPORT-01 ×0, P-SOURCE-01 ×0)

- **P-STR-02 (two-hop cap)** is dead code. Chains are always single-link arrays, so `chain.length > 1` is never true. The spec conflates *hop* (per-link change count) with *chain length* (number of links). The gate implements the length reading; the demo therefore can never show a two-hop refusal. The equivalence table even labels the salbutamol-drank entry `rule: "P-STR-02"`, but the gate rejects it as `P-STR-01`.
- **P-IMPORT-01 (import without citation)** is filtered out in `chains.ts` ("do not emit") before the gate ever sees it — so the refusal can never be displayed. This follows §7 + T-18 literally, but contradicts §8.3/T-09's expectation of a *visible* import refusal, and §14.1's "unmet import citation" no-safe case does not exist in the data.
- **P-SOURCE-01** never fires because every product carries a complete source. Correct behaviour, but unexercised.

**Fix (small, high value):** add one no-safe case whose only candidate is an import without `foreign_registration` *emitted as a refusal* (requires a deliberate §7 exception: emit-then-reject for this case), and one case with a genuine two-link chain to exercise P-STR-02. Alternatively, amend the spec to state these two rules are defensive-only. Either way, the demo should be able to *show* every rule it claims.

### 🔴 2. Reimbursement data has zero negative examples

All 192 preference entries (64 × 3 insurers) are `vergoed`. There is no `niet_vergoed` entry, no stale (>12 mo) list, and no missing-entry case except the deliberately omitted Salbutamol EU product. Consequences: the `niet_vergoed` gate branch is dead, `E-STALE-01` can never trigger, and "reimbursement accuracy" (§14.2) is trivially 100%. **Fix:** flip ~5 entries to `niet_vergoed` (e.g. one Sandoz strength-change product per insurer) so the demo can show a reimbursed-vs-not contrast.

### 🟠 3. Only 1 of 5 API error codes exists

`E-APPROVAL-01` is real (approve + export). `E-SOURCE-01`, `E-STALE-01`, `E-NOSEND-01`, `E-SUBSTANCE-01` (§9.3) are never returned — the corresponding situations degrade to `onbekend` verdicts instead (which is arguably better UX, but the spec table promises errors). Amend §9.3 or emit them.

### 🟠 4. Spec contradictions the implementation resolved correctly (keep the implementation, fix the spec)

| # | Contradiction | Implementation's choice |
|---|---|---|
| a | §14.2 coverage ≥70% vs. T-20 (10/30 must have zero valid chains → max 66.7%) | Keeps T-20, honestly reports **67%** (20/30). ✅ |
| b | §9.2 "only `approve` writes" vs. §9.4 requiring `CASE_OPENED`/`CHAINS_GENERATED`/`ADVICE_EXPORTED` logs | `chain` + `export` stay read-only; first approval backfills open/generate/reject rows. `ADVICE_EXPORTED` is never logged (export is read-only). ✅ documented |
| c | §7 "don't emit import without citation" vs. visible P-IMPORT-01 refusal | Follows §7 + T-18 (see gap 1). ✅ but see fix |
| d | A9 regex `p = 0.\d{3}` vs. real `p = 1.000` (QREFUSE 200/200) | `formatFrequency` is correct; the regex matches only **5/6** frequencies. Spec regex bug. |
| e | T-01 grep `/risk\|score\|…/i` vs. CSS class `version-scores` | Test checks specific forbidden phrases instead. Spec grep would false-positive. |
| f | T-11 "HTML must not contain `vergoed`" vs. the Dutch refusal sentence itself containing *‘vergoed’* in quotes | Test checks `ONBEKEND` present + no `valid` badge instead. Spec assertion unpassable as written. |
| g | §13.2 illustrative "78/200 fragile" vs. computed QFOUT 199/200 | Reports computed values; the one-hop cap is robust *in this model*. ✅ (the spec example is not an invariant) |

### 🟡 5. Demo script (§16.1) no longer matches the data

- Spec: C-017 → "three are refused". Actual: **4 refusals** (3× `P-REIMB-01` onbekend + 1× `P-STR-01`). The quoted salbutamol-drank sentence *is* present. ✅ substance, ❌ count.
- Spec: C-004 → "strength change, onbekend in amber". Actual: C-004 is same-strength salbutamol (CZ) with 2 valid + 2 refusals (EU import onbekend + drank P-STR-01). The onbekend *is* shown, but C-004 is not a strength-change case. **Update the script** (or swap the two case IDs' roles: C-017 is the onbekend showcase).
- C-001 and C-004 are input-identical duplicates (both salbutamol/CZ). Harmless, but one slot is wasted.
- C-008 carries a `renaal` flag that has no effect (sertraline has no contraindication in the data), so it doesn't exercise P-CI-01 despite §14.1's "5 flagged cases".

### 🟡 6. Clinical realism of the demo data (labelled synthetic — do not oversell)

Equivalence is keyed by *form pair only*, so strength changes like metformine 500→850 mg pass as "equivalent" (`tablet|tablet: true`). Only salbutamol drank fails. This is spec-literal (§7.1) and clearly labelled `voorbeelddata`, but a pharmacist jury will notice. The equivalence notes for 19/20 substances are the same generic sentence. **Fix if time allows:** differentiate at least the high-risk strengths (levothyroxine, insuline glargine, oxycodon) as non-equivalent.

### ⚪ 7. Minor / cosmetic

- Missing `scripts/dump-expectations.ts`; `Legend`/`DecisionLine` exist only inline (canvas legend + decision slider in `SwarmLab`), not as named components (§5).
- No stopwatch tile for the §14.2 "time per case" metric.
- `bereiding` route never emitted (no `eu_registered: false` products) — dead route.
- Canvas POS/NEG colours (`#36a474`/`#c44b43`) differ from spec (`#146C4A`/`#A3221C`) — justified adaptation for the dark canvas; NEU matches.
- 71 surnames vs. spec's 70; `buildPersonas(n)` ignores `n`; instrument abstention uses the prior, not the live opinion. All trivial.
- `/api/swarm` takes ~3.7 s (live 200-run ensemble). The page avoids this via committed `runs.json` + a single run — good design, just don't put the API on the demo critical path.
- QFOUT always injects `fout` (rather than conditioning on it firing naturally) — cleaner and defensible.

---

## 3. Section-by-section conformance

| Spec | Status | Notes |
|---|---|---|
| §0 Five-sentence plan, name, thesis | ✅ | "Availability is solved. The work is not." is the hero headline |
| §2 Scope / hard edges | ✅ | No dispensing, no cross-substance, no dosing advice, no real patient data, no LLM in swarm |
| §3 Customer/buyer/competitors | ✅ (copy) | Home page + sovereignty section carry the framing |
| §4 Design language | ✅ | Exact token palette, Inter/Plex Mono/Source Serif self-hosted, 3-column grid (`250px 1fr 340px`), glyph+word badges, Dutch footer verbatim |
| §5 File tree | ✅ minus 3 | Missing `dump-expectations.ts`, `Legend`, `DecisionLine` (see §2.7). Sensible extras: `engine.ts`, `intake.ts`, `data.ts`, `/intake`, `/instrument`, `events.ts`, `sw.js`, `seed-data.mjs` |
| §6 Data contract | ✅ superset | Adds `package`, `substance`/`form`/`source` on links, `secondary_rules` — all needed. Branded `Approved` + `createApproval(by)` enforced; letters accept only `Approved` |
| §7 Chain generation | ✅ with §2.1 caveat | Deterministic, sorted per spec, never cross-substance. Unknown-substance handled in `engine.ts` (equivalent outcome) |
| §7.1 20 substances | ✅ | Exact list, SmPC extracts with source/date/sha256, `voorbeelddata` labels |
| §8 Rule table + gate | ✅ precedence exact | `P-SUB-01→CI→PAEDI→STR-02→STR-01→IMPORT→REIMB→SOURCE`. Refusal sentences match §8.3 (P-SUB-01 + P-UNKNOWN-01 verbatim; others templated equivalents, all >25 chars) |
| §9 API + audit | ✅ superset | All 10 endpoints present (+`GET` export). Hash chain: canonical JSON, sha256, file lock, gap-free seq, tamper→7. Tampered chain blocks export (stronger than spec) |
| §10 Wall T-01…T-20 | ✅ 20/20 pass | Several tests are weaker proxies than the literal spec assertions — necessarily so (see §2.4 d–f). Product behaviour satisfies the *intent* in every case |
| §11 Swarm lab | ✅ faithful | N=240 exact quotas, priors/behav verbatim, engine constants exact (0.42, backfire, Fisher–Yates, 3 events on [3..22]), 9 events verbatim, Wilson exact, all 7 interactive features present, fps printed live |
| §12 Instrument | ✅ | Coverage matrix 2.0/10 → 9.5/10, 14 items, deterministic answering, v1/v2 CSVs |
| §13 Falsifiers/findings | ✅ | 5 falsifiers pre-committed; F4+F5 fired and surfaced prominently; "Wat dit niet zegt" present |
| §14 Guardrails/metrics | ✅ minus §2.2/§2.7 | 30 cases in 10/10/10 split; 0 unsafe proposals; no forbidden claims |
| §15 Energy/sovereignty | ✅ as assumptions | ±1.0/±2.6 kWh shown as spec context, not measurements; sovereignty paraphrased (not verbatim) |
| §16 Demo/pitch | ⚠️ script stale | See §2.5. Slides/Q&A are pitch material, not in repo (expected) |
| §17 36-hour plan | ✅ | Nothing on the "never cut" list was cut |
| §18 Acceptance A1–A14 | ✅ 12/14 clean | A9 fails on regex technicality (5/6, see §2.4d). A1/A2 (console errors, overflow) verified by HTTP + CSS inspection, not a real browser — worth one Playwright pass before the demo |

---

## 4. Can it be in English instead of Dutch?

**Short answer: the UI can, the clinical documents must not — and the spec says so explicitly.**

Dutch is not an accident in this repo; it is a product requirement in four layers:

| Layer | Dutch required by | Why |
|---|---|---|
| Refusal sentences (`reject_reason_nl`, §8.3) | Spec + T-09 (`length > 25` on the `_nl` field) | Read aloud to Dutch pharmacists; the sentence *is* the product |
| GP message + B1 patient text (`gp_message_nl`, `patient_text_nl`) | Spec §2/§6 | B1 is a *Dutch* language level; a GP letter and patient leaflet in English are unusable for real Dutch recipients |
| Footer, error messages, swarm labels/events, instrument items | Spec §4/§9.3/§11/§12 | Legal/audit wording and the simulated population's own language |
| Domain enums + data (`geldig/afgewezen/onbekend`, `vergoed`, `renaal`, forms/packages) | Spec §6/§7.1 | SmPCs, preference lists and ATC data are Dutch source documents |

What is **not** spec-mandated is the UI chrome (navigation, headings, buttons, explanations). That is currently Dutch (`<html lang="nl">`, all copy), and it *could* be English without breaking a single test.

**Options, in order of recommendation:**

1. **English UI + Dutch clinical documents (recommended if the jury is international).** Translate ~15 UI files (`AppShell`, `CaseWorkspace`, `ChainCard`, `RefusalRow`, pages, `SwarmLab`/`Report`, `IntakeForm`, PDF/print headers). Keep refusals, GP/B1 letters, footer, enums and data in Dutch — optionally with an English gloss under each refusal. Effort: medium. Spec impact: none. Tests: unaffected.
2. **Bilingual toggle (best long-term).** EN/NL switcher for the chrome; clinical documents stay NL with EN subtitles. Effort: large, but serves both a Dutch demo and an international jury.
3. **Docs only.** Translate `README.md` + this review to English; leave the product Dutch. Effort: small. (Note: `build-pharmacy.md` itself is already English — only the product and its two docs are Dutch.)
4. **Full English including clinical documents. Not recommended.** Violates §8.3/T-09/§6, breaks Dutch demo realism, and produces patient/GP letters no Dutch recipient can use. Effort: large (domain, data, letters, swarm, instrument, types, tests).

**My recommendation:** keep the product Dutch (it is a Dutch healthcare product — translating the patient letter to English makes it *less* safe, not more accessible). If the audience needs English, do option 1. Tell me which option you want and I'll implement it.

---

## 5. Suggested fix list (in order)

1. Add a visible P-IMPORT-01 case and a genuine two-link P-STR-02 case (§2.1).
2. Add `niet_vergoed` entries to the preference snapshots (§2.2).
3. Update the §16.1 demo script to the real C-004/C-017 behaviour (§2.5).
4. Fix the spec itself: A9 regex, T-01/T-11 assertions, §9.3 error codes, coverage target (§2.3–2.4).
5. Differentiate high-risk equivalence notes (§2.6).
6. One Playwright pass for A1/A2 before the demo (§3).
