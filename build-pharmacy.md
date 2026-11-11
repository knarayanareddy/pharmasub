# Build spec — **Samenstelling**: pharmacy shortage substitution chains, with a MiroFish agent simulation

> **Read this file top to bottom before writing a line of code.** It is the only context you get.
> Every number below is sourced and dated in §19. **Do not invent a clinical rule or a figure.** If a
> substitution rule is not in §8, it is not in the product.
>
> 36-hour build (aiGrunn 2026 / Green Business Challenge, Challenge track). Something must run and be
> demonstrable at 13:00 on day 2.

---

## 0. The five-sentence plan (README, verbatim)

1. Dutch pharmacies face around **26,000 shortage notifications a day**; an average shortage lasts about
   **96 days**, each pharmacy burns roughly **one FTE** finding alternatives, and **46%** of affected patients
   report health deterioration.
2. The national search engine already answers *"which pharmacy has stock"*, and the minister told parliament an
   alternative is available in the pharmacy in **99%** of supply problems — so **availability is not the
   bottleneck. The work is.**
3. We take the prescription and any shortage notice, and produce the **substitution chains that are legal,
   reimbursed and safe** — same active substance, correct strength, an import route where the shortage rules
   allow it — with **every rejected chain and its reason shown next to it**.
4. The **pharmacist approves every line**; the tool never dispenses, never contacts a patient, and never
   proposes a different active substance. The audit log records the rule id behind every decision.
5. **€150–400 per pharmacy per month**, sold through chains and wholesalers, against roughly one FTE of
   pharmacist time (~€70k loaded).

**Product name:** `Samenstelling` (Dutch: *composition* — also the word for a compounded preparation).
Tagline: **"De wet, de vergoeding en de veiligheid — naast elkaar."**
*(The law, the reimbursement and the safety — side by side.)*

**The one-line thesis, say it out loud in the first 20 seconds:**
> **"Availability is solved. The work is not."**

---

## 1. What you are building

**A. The substitution engine (the real product).** Prescription line + shortage notice → document reading →
deterministic chain generation → safety/reimbursement/import gate → ranked valid chains + **a refusal column**
→ pharmacist approval → GP message + B1 patient text → hash-chained audit. §6–§10.

**B. The swarm lab (the wow moment).** A population of **synthetic** pharmacists, GPs, patients, insurers,
wholesalers, regulators, hospital pharmacists and importers that argues about the design bets — with a
force-directed canvas you can drive live and an output of **scenario frequencies with n and 95% intervals**,
never a forecast. §11–§14.

They are joined by one idea: **the swarm finds which assumption the product is betting on**, and the
refusal column is where that bet is visible.

---

## 2. Scope — the hard edges

### Build this
| Area | What |
|---|---|
| Case intake | Prescription line (substance + strength + form + patient flags) + a shortage notice pasted as free text. Accept **any** notice format; do not depend on a licensed feed. |
| Document reading | Deterministic extraction of fields from bundled SmPC extracts and preference-list snapshots (`data/smpc/*.json`, `data/preference/*.json`), with a **source and peildatum on every field**. Optional model path behind an env flag, **off by default**. |
| Chain generation | Deterministic, no model: substance → products → strengths → packages → import options. Cap at **1 hop** by default (§8, P-STR-02). |
| Safety & rules gate | Contraindication vs patient flags, dose-interval equivalence, reimbursement against the insurer's snapshot, import legality under the shortage rules. Every verdict cites a **rule id**. |
| The refusal column | Every rejected chain, always visible, with a Dutch sentence. **This is the product.** |
| Approval | Per-line approve / edit, with the edit logged. |
| Outputs | GP message (Dutch, ≤120 words) + patient explanation at **B1** level, plus a printable A4 "afleveradvies". |
| Audit | Hash-chained append-only JSONL; a verifier page; tamper-row-7 demo. |
| Swarm lab | §11–§14, fully specified. |

### Explicitly do NOT build
- ❌ Dispensing, ordering, stock feeds, pharmacy-information-system integration, patient app, chat.
- ❌ **Any cross-substance (therapeutic) substitution.** Ever. It is `P-SUB-01`: escalate to a human with the
  message *"farmacotherapeutisch alternatief — vereist apotheker/arts"*, and show that refusal.
- ❌ Any dosing advice to a patient. The patient text explains *what changed and why*, never *how much to take*.
- ❌ Any guarantee of reimbursement. You report the insurer's rule with a `peildatum`, and `onbekend` is a
  first-class answer.
- ❌ Any real patient data, names, BSN or prescription images. The demo uses synthetic patient flags only.
- ❌ Real LLM calls in the swarm. None. (§11.0)

---

## 3. Customer, buyer, and the two facts that will be used against you

**User:** a pharmacist (or pharmacy technician) behind the counter, in the 20–45 minutes per case they
currently lose.

**Buyer:**
1. **A pharmacy chain or a wholesaler's pharmacy network** — one contract, 50–400 pharmacies, real budget.
2. **An independent pharmacy** you can visit in 36 hours. Sit behind the counter for two hours; that is the
   product brief.
3. **A hospital pharmacy** as a credibility reference — ~95% of Dutch hospitals already use a shortage search
   engine, so they understand the problem and will tell you exactly what is missing.

**Own these two facts before the jury raises them:**

| Fact | Your answer |
|---|---|
| `geneesmiddelentekort.nl` already exists; ~95% of hospitals use it | *"It finds who has stock. That is a search problem and it is solved. We answer the next question: is the swap legal, is it reimbursed, and is it safe for this patient."* |
| The minister says an alternative exists 99% of the time | *"Then the pain is the work: 96 days per shortage, ~1 FTE per pharmacy, 46% of affected patients reporting deterioration. Both statements are true and we show both."* |

**Competitors, named:**

| Player | What they do | Their gap / your answer |
|---|---|---|
| `geneesmiddelentekort.nl` | National shortage search; stock availability | Search, not legality/reimbursement/safety. **We start where the search ends.** |
| **KNMP Farmanco** (€450/yr pharmacy; €2,064/yr non-pharmacy orgs) | Shortage register: cause, expected date, pharmaceutical substitution, therapeutic alternatives | It *informs*. It does not do reimbursement, patient-specific safety, or the paperwork. **We consume notices from any source; Farmanco is an integration, not a dependency.** |
| **Pharme (Mosadex)** | Alternative sourcing, import, therapeutic alternatives with KNMP-GIC | It sells the alternative. **We are the reasoning layer that decides which alternative to ask for.** |
| **Pharmacy information systems / wholesaler portals** | Dispensing, stock, ordering, NMVS/FMD | Systems of *record*. **We sit at the edge and integrate.** |
| **Preference policy (preferentiebeleid)** | Insurers switch preferred products yearly; ~74% of shortages hit preference drugs | Regulatory churn *creates* the work. **Our rules table is the artefact that survives the churn.** |

---

## 4. Design language

Clinical, quiet, and unmistakably *not* a consumer app. A pharmacist must be able to read it under time
pressure without a colour code failing on them. **Never encode a safety verdict by colour alone** — every
verdict carries a glyph and a word.

```
--ink        #14202B   cool near-black
--paper      #FFFFFF
--paper-2    #F4F6F8   wells, table stripes
--line       #DCE2E8
--muted      #5C6B78
--valid      #146C4A   green: chain is usable
--reject     #A3221C   red: chain refused — glyph ✗ + the word "AFGEWEZEN"
--unknown    #8A6100   amber: status unknown — glyph ? + "ONBEKEND"  (a first-class answer, not an error)
--human      #1F4E79   blue: awaits a pharmacist
--flag       #6B21A8   purple: patient flag present
```

Type: **Inter** 400/500/600 for UI, **IBM Plex Mono** for codes/strengths/dates/rule ids, **Source Serif 4**
for the printed "afleveradvies" and the GP message (these get read as documents). Self-host as `woff2`; no CDN.

**Layout rule that matters:** the screen is **three columns and nothing else** —
`prescription + flags` | `chains` | `refusals`. The refusals column is **always visible, never behind a tab or an
accordion.** Its presence on screen *is* the FairTech claim.

Motion: 120 ms hover, 200 ms state change, honour `prefers-reduced-motion`. No celebratory animations — this is
a clinical tool.

Footer on every screen: `Demo — synthetische casussen. Geen echte patiëntgegevens. Geen medisch advies.`

---

## 5. File tree

```
samenstelling/
├─ README.md  package.json  tsconfig.json  next.config.ts
├─ public/fonts/                       # Inter, IBM Plex Mono, Source Serif 4 (woff2, self-hosted)
├─ data/
│  ├─ substances.json                  # 20 substances, the rule table (§8.2)
│  ├─ smpc/<substance>.json            # extracted SmPC fields + source + date
│  ├─ preference/2026-cz.json          # insurer preference list snapshot (synthetic-but-realistic)
│  ├─ preference/2026-vgz.json
│  ├─ notices/<case>.txt               # 30 real-shaped shortage notices (synthetic text)
│  ├─ cases.json                       # 30 cases: 10 same-strength, 10 strength/package, 10 no safe chain
│  ├─ patients.json                    # synthetic patient flags only (renal, pregnancy, paediatric, allergy)
│  ├─ swarm/personas.json              # generated
│  ├─ swarm/falsifiers.json            # WRITTEN FIRST, committed before the ensemble (§13.1)
│  └─ swarm/runs.json                  # 200 ensemble runs
├─ scripts/
│  ├─ gen-swarm.ts   verify-chain.ts   dump-expectations.ts   qa.ts
├─ src/
│  ├─ domain/
│  │  ├─ types.ts                      # §6 — write first
│  │  ├─ rules.ts                      # the rule table (§8), data + precedence
│  │  ├─ chains.ts                     # deterministic chain generation (§7)
│  │  ├─ gate.ts                       # safety + reimbursement + import (§8.3–8.6)
│  │  ├─ refusals.ts                   # the rejection sentences (§8.7)
│  │  ├─ letters.ts                    # GP message + B1 patient text + afleveradvies
│  │  ├─ hashchain.ts                  # §9.4
│  │  ├─ swarm/{rng,archetypes,personas,engine,ensemble,instrument}.ts
│  │  └─ invariants.ts                 # §10
│  ├─ app/
│  │  ├─ layout.tsx globals.css page.tsx          # case list
│  │  ├─ case/[id]/page.tsx                       # the three-column screen
│  │  ├─ case/[id]/print/page.tsx                 # A4 afleveradvies + GP letter (print CSS)
│  │  ├─ verify/page.tsx                          # audit verifier + tamper demo
│  │  ├─ swarm/page.tsx swarm/SwarmCanvas.tsx swarm/Report.tsx
│  │  └─ api/{health,case,chain,approve,audit,swarm,survey,export}/route.ts
│  └─ components/ (ChainCard, RefusalRow, RuleChip, FlagPill, SourceLine, Legend, StatTile, DecisionLine)
└─ logs/audit.jsonl
```

**Stack:** Next.js 16 + React 19 + TS strict; plain CSS with custom properties (no Tailwind — it will fight
the three-column grid); **no database** (JSONL + JSON files); `vitest`; **no runtime external API** — the demo
must run with the cable unplugged.

---

## 6. Data contract — write this file first

```ts
// src/domain/types.ts
export type Route = "nl_geregistreerd" | "import" | "bereiding";
export type Verdict = "geldig" | "afgewezen" | "onbekend";
export type Reimbursement = "vergoed" | "niet_vergoed" | "onbekend";
export type PatientFlag = "renaal" | "zwangerschap" | "pediatrisch" | "allergie_penicilline" | "allergie_nsaid" | "leverfunctie";

export interface Case {
  case_id: string;                 // "C-001"
  substance: string;                // INN, lowercase: "salbutamol"
  atc: string;                      // "R03AC02"
  strength: string;                 // "100 mcg"
  form: string;                     // "inhalatiepoeder"
  patient_flags: PatientFlag[];     // synthetic
  insurer: "CZ" | "VGZ" | "Menzis" | "onbekend";
  notice_ref: string | null;        // pointer into data/notices
  age_band: "0-11" | "12-17" | "18-64" | "65+";
}

export interface ChainLink {
  product: string;                  // "Salbutamol CF 100 mcg inhalatiepoeder"
  strength: string;
  package: string;                  // "200 doses"
  route: Route;
  foreign_registration: string | null;  // required when route === "import"
  hop: 0 | 1;                       // 0 = identical product, 1 = one change (strength/package/route)
}

export interface ChainVerdict {
  chain_id: string;
  chain: ChainLink[];
  status: Verdict;
  rules_passed: string[];           // rule ids, e.g. ["P-SUB-01","P-STR-01","P-REIMB-01"]
  reject_rule: string | null;       // exactly one rule id when status is afgewezen
  reject_reason_nl: string | null;
  reimbursement: Reimbursement;
  reimbursement_source: { insurer: string; list: string; peildatum: string } | null;
  sources: { doc: string; field: string; date: string; sha256: string }[];
}

export interface SubstitutionAdvice {
  case: Case;
  chains: ChainVerdict[];
  top: string | null;               // chain_id, only when a valid chain exists
  refusals: ChainVerdict[];         // every afgewezen/onbekend chain — always shown
  gp_message_nl: string;
  patient_text_nl: string;          // B1
  needs_pharmacist: true;           // never false
  approved: { chain_id: string; by: string; at: string; edits: Edit[] } | null;
}

export interface Edit {
  field: "chain" | "patient_text" | "gp_message" | "reimbursement";
  from: string;
  to: string;
  by: string;
  at: string;
  note_nl: string | null;
}
```

**Invariant to enforce in the type system, not just in prose:** `needs_pharmacist` is the literal `true`.
If a code path tries to auto-approve, it must not compile. Use `readonly` and a branded type:

```ts
export type Unapproved = { readonly _unapproved: unique symbol };
export type Approved = { readonly chain_id: string; readonly by: string; readonly at: string };
// letters.ts only accepts Approved. There is no constructor for Approved that does not take a pharmacist id.
```

---

## 7. Chain generation (deterministic — no model in the decision)

```
generateChains(case, substanceTable) -> ChainVerdict[]

1. p = substanceTable[case.substance]. If absent -> return [{status:"onbekend",
      reject_rule:"P-UNKNOWN-01", reject_reason_nl:"Deze stof staat niet in onze tabel."}]
      NEVER guess. A miss is a visible miss.
2. products = p.products  // every product with the same INN, incl. foreign-registered ones
3. For each product:
     hop = (product.strength !== case.strength || product.form !== case.form ||
            product.package !== case.package) ? 1 : 0
     emit one chain per package of that product
4. Route assignment:
     - registered in NL  -> "nl_geregistreerd"
     - registered in EU but not NL, and the shortage rules allow -> "import", with
       foreign_registration REQUIRED (if missing, do not emit the chain — that is P-IMPORT-01)
5. Sort the raw list by: hop asc, package size closest to the original, route preference
   (nl_geregistreerd > import > bereiding), then product name asc for stability.
6. NEVER emit a chain that changes the active substance. There is no code path for it. (P-SUB-01)
7. Cap: if hop === 1 and case is NOT flagged `allow_two_hops` by a pharmacist, do not
   chain a second change on top. (`P-STR-02`, §8.5)
```

**Determinism:** same case → byte-identical chain list. Assert it (`T-14`).

### 7.1 The 20 substances (`data/substances.json`)

Include at minimum, chosen because they are real Dutch shortage-adjacent, high-volume, and cover every gate:
`salbutamol`, `metformine`, `atorvastatine`, `omeprazol`, `amoxicilline`, `levothyroxine`, `sertraline`,
`oxycodon`, `furosemide`, `prednison`, `insuline glargine`, `methylfenidaat`, `tamsulosine`, `escitalopram`,
`naproxen`, `paracetamol (zetpil)`, `amoxicilline/clavulaanzuur`, `hydrochloorthiazide`, `pantoprazol`,
`azitromycine`.

Each entry:
```json
{
  "substance": "salbutamol", "atc": "R03AC02",
  "products": [
    { "product": "Salbutamol CF 100 mcg inhalatiepoeder", "strength": "100 mcg", "form": "inhalatiepoeder",
      "packages": ["200 doses"], "nl_registered": true, "smPC_ref": "smpc/salbutamol.json" },
    { "product": "Ventolin 100 mcg aerosol", "strength": "100 mcg", "form": "aerosol",
      "packages": ["200 doses"], "nl_registered": true, "smPC_ref": "smpc/salbutamol.json" },
    { "product": "Salbutamol Sandoz 2 mg/5 ml drank", "strength": "2 mg/5 ml", "form": "drank",
      "packages": ["150 ml"], "nl_registered": true, "smPC_ref": "smpc/salbutamol.json" }
  ],
  "dose_interval_equivalence": {
    "inhalatiepoeder|aerosol": { "equivalent": true,  "rule": "P-STR-01", "note_nl": "zelfde dosisinterval, andere toedieningsvorm — controleer de inhalatietechniek" },
    "aerosol|drank":           { "equivalent": false, "rule": "P-STR-02", "note_nl": "ander dosisinterval — niet uitwisselbaar zonder controle" }
  },
  "contra_indications": { "renaal": false, "zwangerschap": false, "pediatrisch": false, "allergie_penicilline": false }
}
```

**Every field must carry a source.** The SmPC extract JSON is
`{ field, value, quote_nl, source: "SmPC <product> §4.2", date, sha256 }`. If you cannot source a field, it does
not exist in the demo — `null`, and the chain becomes `onbekend`, never "probably fine".

---

## 8. The rule table and the gate (this is the FairTech product)

### 8.1 Rules, in precedence order

| id | Rule | Fails when | Behaviour |
|---|---|---|---|
| `P-SUB-01` | Never propose a different active substance | the case needs a therapeutic alternative | **REJECT**, reason: *"farmacotherapeutisch alternatief — vereist apotheker/arts"* |
| `P-STR-01` | A strength/form change is allowed only when the dose interval can be preserved | `dose_interval_equivalence` says not equivalent | **REJECT** with the equivalence note |
| `P-STR-02` | Cap at one hop unless a pharmacist expands it | chain length 2+ without `allow_two_hops` | **REJECT** with *"twee wijzigingen — apotheker moet uitbreiden"* |
| `P-CI-01` | No chain with an unresolved contraindication against a patient flag | any `contra_indications[flag] === true` with no SmPC resolution | **REJECT**, and show the flag next to it |
| `P-REIMB-01` | Reimbursement must be resolved for the patient's insurer | preference snapshot missing, stale > 12 months, or insurer `onbekend` | status `onbekend` — **never** presented as reimbursed |
| `P-IMPORT-01` | Import only under the shortage rules, with the foreign registration cited | no `foreign_registration`, or the product is NL-registered (then it is not an import) | **REJECT** |
| `P-PAEDI-01` | A paediatric case may not receive an adult-only formulation | `age_band` is `0-11` and the SmPC marks the product adult-only | **REJECT** |
| `P-NOSEND-01` | Nothing is sent to a GP or patient by the system | any code path attempts a send | **throws**, and the letter is only ever rendered to screen/PDF |
| `P-UNKNOWN-01` | An unknown substance is `onbekend`, never a guess | substance not in the table | `onbekend` with the reason shown |
| `P-SOURCE-01` | Every displayed field cites a document and a date | a field with no `source` | field not rendered; chain degraded to `onbekend` |

**Precedence:** `P-SUB-01` → `P-CI-01` → `P-PAEDI-01` → `P-STR-02` → `P-STR-01` → `P-IMPORT-01` →
`P-REIMB-01` → `P-SOURCE-01`. A chain is rejected by the **first** rule that fails, and only that one is shown
as the primary reason (others may be listed as secondary, greyed).

### 8.2 Gate evaluation

```ts
function evaluate(chain: ChainLink[], c: Case, table: SubstanceTable): ChainVerdict {
  // 1 P-SUB-01  — impossible by construction; assert it anyway and throw if violated
  // 2 P-CI-01   — for each patient flag, look up contra_indications; if true and unresolved -> reject
  // 3 P-PAEDI-01
  // 4 P-STR-02  — chain.length > 1 && !allowTwoHops -> reject
  // 5 P-STR-01  — equivalence table lookup for form|form
  // 6 P-IMPORT-01
  // 7 P-REIMB-01 -> reimbursement: vergoed | niet_vergoed | onbekend (+ source + peildatum)
  // 8 P-SOURCE-01 -> collect sources; any missing -> onbekend
  // returns the first failing rule as reject_rule, else status "geldig"
}
```

### 8.3 The refusal sentences (`refusals.ts`) — write these carefully, they are read aloud on stage

```
P-SUB-01    "Een ander werkzaam bestanddeel is geen substitutie maar een therapiewijziging. Dat beslist de apotheker samen met de voorschrijver."
P-STR-01    "Salbutamol 2 mg/5 ml drank heeft een ander dosisinterval dan 100 mcg inhalatiepoeder — niet uitwisselbaar zonder controle."
P-STR-02    "Deze keten wijzigt sterkte én verpakking. Twee wijzigingen vragen een expliciete beoordeling door de apotheker."
P-CI-01     "Deze patiënt heeft een nierfunctiestoornis; de SmPC van dit product vraagt dosisaanpassing. Niet automatisch uitwisselbaar."
P-REIMB-01  "De vergoeding is onbekend: de preferentielijst van {verzekeraar} is van {peildatum} en noemt dit product niet. Onbekend is geen 'vergoed'."
P-IMPORT-01 "Voor deze import ontbreekt de buitenlandse registratie. Zonder citeerbare registratie geen importroute."
P-PAEDI-01  "Dit product is niet geregistreerd voor kinderen onder de 12; de casus is pediatrisch."
P-UNKNOWN-01"Deze stof staat niet in onze regeltabel. Wij gokken niet — de apotheker beslist."
```
**Every rejection sentence must be specific enough that a pharmacist learns something from it.** Generic
sentences ("not allowed") fail the demo.

---

## 9. Architecture, API, audit

### 9.1 The seven stages

| # | Stage | In | Out | Refuses |
|---|---|---|---|---|
| 1 | INPUT | prescription line + notice | `{substance, strength, form, patient_flags}` | an illegible/unparseable line — asks for the product code |
| 2 | DOCUMENT READING | SmPC extracts, preference entry, notice | fields **with sources** | a field with no source (leaves it null) |
| 3 | CHAINS (logic) | substance | candidate chains | any chain crossing substances (no code path) |
| 4 | GATE | candidates + flags | PASS/REJECT per chain with a rule id | an unresolved contraindication; unknown reimbursement presented as reimbursed |
| 5 | RANK | surviving chains | ranked list | ranking a rejected chain as if usable |
| 6 | REFUSALS | all chains | the refusal column | hiding a rejection |
| 7 | HUMAN | approved chain | GP message + patient text + audit | sending anything automatically |

### 9.2 API

```
GET  /api/health                         -> { ok, rows }
GET  /api/case                           -> { cases: Case[] }
GET  /api/case/:id                       -> { case, advice: SubstitutionAdvice }
POST /api/chain                          body { case_id }        -> SubstitutionAdvice (no persistence)
POST /api/approve                        body { case_id, chain_id, by, edits[] } -> { seq, hash, advice }
POST /api/export/:id?format=pdf|json     -> the afleveradvies (Approved only — 409 otherwise)
GET  /api/audit                          -> { total, verified, brokenAt }
POST /api/audit                          body { op:"tamper"|"reset" }   // dev only
GET  /api/swarm?runs=200&seed=20261111   -> EnsembleResult + archetypes + dims + events
POST /api/swarm/fire                     body { event_id, seed }        -> one run with injection
GET  /api/survey?version=v1|v2           -> CSV of the synthetic responses
```

`POST /api/chain` must not write. `POST /api/approve` is the only writer besides the audit endpoint.
`/api/export` returns **409 `E-APPROVAL-01`** unless the advice carries an `Approved` token.

### 9.3 Error codes

| code | when | Dutch |
|---|---|---|
| `E-APPROVAL-01` | export/letter without a pharmacist approval | "Een afleveradvies vereist goedkeuring door de apotheker." |
| `E-SOURCE-01` | a field with no source | "Dit veld heeft geen bron; het wordt niet getoond." |
| `E-STALE-01` | preference list older than 12 months | "De preferentielijst is {n} maanden oud." |
| `E-NOSEND-01` | any attempt to send | "Dit systeem verstuurt niets." |
| `E-SUBSTANCE-01` | unknown substance | "Onbekende stof — geen gok." |

### 9.4 Hash chain

Identical contract to any other build here:
```ts
canonicalJson(v)          // keys sorted at every level
hashRow(row)              // sha256 over { seq, ts, actor, action, subject, payload, prev_hash }
```
Append to `logs/audit.jsonl` under an exclusive lock; gap-free `seq`. The verifier walks the file and returns
`{ total, verified, brokenAt }`. `POST /api/audit {op:"tamper"}` must make the verifier report **`brokenAt: 7`**.

Audit actions to log: `CASE_OPENED`, `CHAINS_GENERATED`, `CHAIN_REJECTED` (with rule id), `CHAIN_APPROVED`
(with pharmacist id), `EDIT_MADE`, `ADVICE_EXPORTED`. **`CHAIN_REJECTED` is an audit event, not a UI state** —
a regulator's inspector asks "show me every substitution the system refused", and you must be able to answer.

---

## 10. The wall — twelve rules and their tests

**`npm test` runs all of these. If a rule fails, change the implementation, never the assertion.**

| # | Rule | Test | Assertion |
|---|---|---|---|
| W1 | **No score about a patient.** No field names a patient's risk, adherence, likelihood, cost or "appropriateness". | `T-01` | Grep `src/` for `/risk|score|priority|adherence|compliance|likelihood/i` → only allowed inside rule **ids** and comments. `Case` has no numeric field besides `age_band` (a band, not a number). |
| W2 | **No free-text scoring.** Notice text is parsed into fields, never scored. | `T-02` | No function returns a number derived from notice text except counts of extracted fields. |
| W3 | **No AI-text detection / authorship.** | `T-03` | Grep for `detector|authorship|perplexity` → absent. |
| W4 | **No image classification.** | `T-04` | No image upload path. |
| W5 | **No phone/identity.** | `T-05` | No `phone|bsn|paspoort|documentnummer` fields; grep enforced. |
| W6 | **No patient identifiers stored.** Only flags and an age *band*. | `T-06` | `Case` type has no name/DOB/address; fixtures contain no names. |
| W7 | **No dispensing, no custody.** | `T-07` | No order/dispense endpoints. |
| W8 | **Nothing is sent.** | `T-08` | `P-NOSEND-01`; grep for `fetch(` on a mail/SMTP path → none; `/api/export` returns a file, never sends. |
| W9 | **Every rejection has a rule id and a Dutch reason.** | `T-09` | For every `afgewezen` chain: `reject_rule ∈ RULES` and `reject_reason_nl.length > 25`. |
| W10 | **A substitution always ends with a named human.** | `T-10` | `SubstitutionAdvice.needs_pharmacist === true`; `/api/export` without approval → 409; the `Approved` type cannot be constructed without `by`. |
| W11 | **`onbekend` is never rendered as `vergoed`.** | `T-11` | For every chain with `reimbursement === "onbekend"`, the rendered HTML contains the string `ONBEKEND` and does **not** contain `vergoed` within the same card. |
| W12 | **Every displayed field cites a source and a peildatum.** | `T-12` | Every rendered `[data-field]` element has a `data-source` and `data-date` attribute. |

Structural tests:

| id | Assertion |
|---|---|
| `T-13` | `POST /api/chain` does not append to `logs/audit.jsonl`. |
| `T-14` | Chain generation is deterministic over all 30 cases. |
| `T-15` | `seq` values are `1..n`, no gaps, no repeats. |
| `T-16` | Tamper row 7 → `brokenAt === 7`; reset → `null`. |
| `T-17` | No file under `src/domain/swarm/` is imported outside `swarm/` or by any `/api/(case|chain|approve)` route. **The simulation can never influence a substitution decision.** |
| `T-18` | No chain with `route === "import"` exists without a non-empty `foreign_registration`. |
| `T-19` | Zero chains vary the active substance: for every chain, every link's substance === `case.substance`. |
| `T-20` | The 10 cases designed to have no safe chain return **zero** `geldig` chains. |

---

## 11. The MiroFish swarm lab

### 11.0 The sentence you must say on stage

> **"No language model is called. Anywhere. This is a dynamical system over a synthetic population — the
> output is a frequency, not a forecast, and the prior table is on screen for you to argue with."**

### 11.1 Why it exists in *this* product

The pitch makes six bets:
1. pharmacists will accept a tool that **refuses** more often than it proposes (→ `refuse`),
2. pharmacists will accept the **1-hop cap** (→ `hops`),
3. the **legality + reimbursement** layer is worth paying for, not just the stock search (→ `payer`),
4. GPs will accept a substitution message from a pharmacist via this tool (→ `gp`),
5. `onbekend` is an acceptable answer to a professional under time pressure (→ `unknown`),
6. patients accept a substitution if it is explained at B1 (→ `patient`).

The swarm tells you which of those the population would break, as a frequency.

### 11.2 Six dimensions

| id | label (NL) | left pole | right pole | blurb |
|---|---|---|---|---|
| `refuse` | Weigeren is een functie | *"beter een gok dan niets"* | *"liever weigeren dan gokken"* | The design's central claim: a visible refusal beats a confident guess. |
| `hops` | Maximaal één wijziging | *"zoveel mogelijk ketens"* | *"maximaal één hop"* | Coverage versus safety, as a single number. |
| `payer` | De apotheek betaalt | *"de verzekeraar of groothandel betaalt"* | *"de apotheek betaalt"* | Who funds the tool, asked as an opinion. |
| `gp` | De huisarts accepteert een bericht via de tool | *"de huisarts wil bellen"* | *"een bericht is genoeg"* | The workflow promise nobody validates. |
| `unknown` | Onbekend mag | *"onbekend is onacceptabel"* | *"onbekend is een eerlijk antwoord"* | Whether professional culture tolerates "I don't know". |
| `patient` | De patiënt accepteert uitleg op B1 | *"de patiënt wil hetzelfde product"* | *"uitleg op B1 is genoeg"* | The last mile of every substitution. |

### 11.3 Archetypes — **N = 240**, exact quotas

| key | label | n | who |
|---|---|---|---|
| `pharm_ind` | Openbare apothekers (zelfstandig) | 46 | independent pharmacy owners |
| `pharm_tech` | Apothekersassistenten | 34 | the people who actually do the 45 minutes |
| `pharm_chain` | Apothekers in ketens | 26 | chain pharmacists, protocol-driven |
| `pharm_hosp` | Ziekenhuisapothekers | 18 | hospital pharmacy, heaviest search-engine users |
| `gp` | Huisartsen | 30 | the prescriber on the other end |
| `patient` | Patiënten | 34 | chronically ill, elderly, parents |
| `insurer` | Zorgverzekeraars | 16 | preference-policy owners |
| `wholesaler` | Groothandel / importeur | 18 | supply side, profits from substitution volume |
| `regulator` | IGJ / inspectie | 10 | the reader of your audit log |
| `import` | Import- en bereidingsapotheken | 8 | the ones who can actually import |

```ts
export const ARCH = {
  pharm_ind:   { n: 46, priors: { refuse: .70, hops: .58, payer: .60, gp: .52, unknown: .62, patient: .56 }, behav: { voice: .74, susceptibility: .50, conviction: .55 } },
  pharm_tech:  { n: 34, priors: { refuse: .58, hops: .52, payer: .46, gp: .56, unknown: .55, patient: .58 }, behav: { voice: .52, susceptibility: .64, conviction: .45 } },
  pharm_chain: { n: 26, priors: { refuse: .64, hops: .70, payer: .54, gp: .50, unknown: .58, patient: .52 }, behav: { voice: .60, susceptibility: .44, conviction: .60 } },
  pharm_hosp:  { n: 18, priors: { refuse: .78, hops: .74, payer: .52, gp: .48, unknown: .70, patient: .50 }, behav: { voice: .66, susceptibility: .40, conviction: .66 } },
  gp:          { n: 30, priors: { refuse: .52, hops: .44, payer: .38, gp: .40, unknown: .46, patient: .52 }, behav: { voice: .62, susceptibility: .44, conviction: .62 } },
  patient:     { n: 34, priors: { refuse: .44, hops: .36, payer: .30, gp: .44, unknown: .30, patient: .66 }, behav: { voice: .46, susceptibility: .70, conviction: .48 } },
  insurer:     { n: 16, priors: { refuse: .56, hops: .62, payer: .82, gp: .46, unknown: .52, patient: .48 }, behav: { voice: .58, susceptibility: .30, conviction: .74 } },
  wholesaler:  { n: 18, priors: { refuse: .34, hops: .88, payer: .22, gp: .46, unknown: .34, patient: .46 }, behav: { voice: .64, susceptibility: .34, conviction: .70 } },
  regulator:   { n: 10, priors: { refuse: .90, hops: .66, payer: .40, gp: .52, unknown: .78, patient: .54 }, behav: { voice: .70, susceptibility: .22, conviction: .84 } },
  import:      { n: 8,  priors: { refuse: .48, hops: .92, payer: .44, gp: .50, unknown: .50, patient: .50 }, behav: { voice: .56, susceptibility: .36, conviction: .64 } },
} as const;
```

Read the shape of it: **`wholesaler.hops = .88` and `regulator.refuse = .90` are on opposite sides of the design.**
That is the finding the demo is built to show — the supply side wants more substitution and the regulator wants
more refusal, and a pharmacist sits between them. Say that out loud.

### 11.4 Personas

`buildPersonas(n=240, seed=20261111)`: id `P-001…`, synthetic Dutch name from a fixed list of 70 surnames
(including Turkish, Moroccan, Polish, Syrian surnames — Dutch pharmacy staff and patients are not one
demographic), `years_experience` (staff), `pharmacy_type`, `region`, `patient_condition` (patients only:
`chronisch`, `ouderen`, `ouder_van_kind`, `zwanger`), plus jittered priors (±0.04) and behav (±0.05).
`synthetic: true` on every card.

### 11.5 Engine

Implement exactly this — it is ~150 lines and every constant matters:

```
runSwarm(personas, { rounds=24, mixing=0.18, pressure=1, seed, minEvents=3, inject? })
1  rnd = mulberry32(seed)
2  eventPlan: exactly 3 events, Fisher–Yates on eligible rounds [3..rounds-2] and on the event list;
   `inject` replaces any planned occurrence of the same story. NEVER `arr.sort(() => rnd()-0.5)`.
3  graph: degree 7, `local = round(7*(1-mixing))` same-archetype edges + `7-local` uniform edges, deduped.
4  opinions start at prior ± 0.09 jitter.
5  per round: Fisher–Yates agent order; each agent hears one random neighbour; per dimension
     gap = o[j]-o[i]; likeness = 1-min(1,|gap|*1.4);
     influence = (0.35+0.65*voice_j)*(0.4+0.6*likeness);
     openness  = susceptibility_i*(1-0.75*conviction_i);
     move = gap*influence*openness*0.42*pressure;
     BACKFIRE if |gap|>0.45 && conviction_i>0.6 && rnd()<0.5:
       move = -sign(gap)*|gap|*0.10*pressure
6  events fire at their planned round: opinion += effect*(0.6+0.8*rnd()) per dimension, clamped.
7  snapshot each round: mean, camps (left <0.42 / swing / right >0.58), event label.
8  final means and support shares; per-agent `changed`.
```

### 11.6 The nine events (Dutch copy; ≥3 must push the design backwards)

| id | label | effect |
|---|---|---|
| `tekortpiek` | *"Een tekort aan een veelgebruikte bloedverdunner houdt zes weken aan"* | `refuse +.06, patient −.08, unknown +.05` |
| `fout` | *"Een apotheek geeft de verkeerde sterkte af; het staat in het nieuws"* | `refuse +.14, hops +.10, patient −.10` |
| `petitie` | *"De landelijke petitie over geneesmiddelentekorten haalt 200.000 handtekeningen"* | `payer +.08, gp +.05, patient +.06` |
| `vergoeding` | *"Een verzekeraar verandert per 1 januari het preferentiebeleid"* | `payer +.06, unknown +.08, refuse +.03` |
| `importstop` | *"De IGJ beperkt de importroute voor twee stoffen"* | `hops −.10, refuse +.05` |
| `ai_fout` | *"Een AI-systeem stelt een verkeerde substitutie voor; de inspectie grijpt in"* | `refuse +.16, patient −.12, unknown +.08` |
| `werkdruk` | *"Het personeelstekort in apotheken loopt op tot 3.000 fte"* | `payer +.10, hops +.08, gp −.06` |
| `b1` | *"Patiëntenfederaties eisen uitleg op B1-niveau"* | `patient +.10, gp +.04` |
| `besluit` | *"Het tekortenbesluit wordt verruimd: meer ruimte voor buitenlandse producten"* | `hops +.12, refuse −.06, unknown +.04` |

### 11.7 Ensemble and the six frequencies

`runEnsemble(personas, runs = 200)`: seeds `20261111 + r*7919`; per dimension mean/sd/p10/p50/p90 and a 0.05
histogram; then the frequency tests. **Every frequency rendered as `x / n runs (p = 0.000, 95% CI 0.000–0.000)`**
(Wilson interval, §11.9).

| id | question | test |
|---|---|---|
| `QREFUSE` | Do a majority of pharmacists accept "refuse rather than guess"? | `pharm_*`, `support.refuse > .5` |
| `QHOPS` | Do a majority accept the 1-hop cap? | `pharm_*`, `support.hops > .5` |
| `QPAYER` | Does a majority say the pharmacy pays? | all, `support.payer > .5` |
| `QGP` | Do a majority of GPs accept a message instead of a call? | `gp`, `support.gp > .5` |
| `QUNKNOWN` | Does a majority tolerate `onbekend`? | `pharm_*`, `support.unknown > .5` |
| `QFOUT` | **After the dispensing-error story, does the 1-hop majority survive?** | fired `fout`, `pharm_*`, `support.hops > .5` |

### 11.8 Honesty block (all four, permanently on screen)
`GEEN LLM` · `SYNTHETISCH` · `GEEN VOORSPELLING` · `PRIOREN ZIJN AANNAMES`

### 11.9 Wilson interval

```ts
export function wilson(p: number, n: number, z = 1.959964) {
  const d = 1 + z*z/n, c = p + z*z/(2*n), s = z*Math.sqrt(p*(1-p)/n + z*z/(4*n*n));
  return { lo: (c-s)/d, hi: (c+s)/d };
}
```

### 11.10 The interactive layer (reuse this vocabulary — it works)
1. **Playback**: Start / Pause / Step / Reset, `1× 2× 4×`, 24 rounds.
2. **Scrub** a round slider; the canvas re-renders that snapshot; a sparkline underneath shows all six means
   with event ticks on the x-axis.
3. **Fire your own story**: nine chips; firing re-runs the whole simulation with `inject`; a ghost outline of
   the previous final camps stays visible so the audience sees the delta.
4. **The draggable decision line** at 0.5 on the selected dimension: drag it and the recount updates live
   (*"met de lijn hier staan 141 van de 240 aan de rechterkant"*).
5. **Two levers**: `druk` (0.4–2.0) and `vermenging` (0–1). At mixing 0 the graph must visibly shatter into ten
   non-communicating clusters — say: *"dit is wat homofilie doet met een beroepsgroep."*
6. **Hover/click an agent** → profile card with three facts, six prior bars, and **how much they moved**; then
   *"Waarom veranderde deze?"* listing the events and neighbours that did it.
7. **Report tab**: the six frequencies with n/CI, the falsifier table, the three findings, and *"Wat dit niet zegt."*

### 11.11 Canvas spec
One `<canvas>`, no library, `requestAnimationFrame`, DPR-aware, `ResizeObserver`,
ten cluster centres on a circle, 240 nodes / ~1,500 edges, `alpha` annealing from 1 by `*0.992`, centre
attraction `0.012·alpha` (hubs `0.03`), pairwise repulsion inside radius 20 (hubs 46) with `f = r²/d²·0.35·alpha`,
springs rest length 34 (hubs 120) stiffness 0.01 (hubs 0.0012), damping 0.84, 12 px clamp. Draw:
ground → 48 px grid at 2.5% white → cluster halos (radial gradient, 92 px) → agent edges → hub edges → agents →
pulses → labels → legend. Agent fill = stance colour on the selected dimension
(`POS #146C4A`, `NEG #A3221C`, `NEU #8C97A1`); unreached agents at 28% alpha. Pulses travel the edge in 380 ms.
No WebGL, no d3. ≥55 fps at 240 nodes, and **print the measured fps on screen** (it is a rubric answer).

---

## 12. The instrument

### 12.1 v1 — what a team writes by default, and why it cannot answer the question

Ten items in the default shape: *"What is your biggest frustration with shortages?"*, *"How likely would you
use a tool like this?"*, *"Which feature matters most?"* (single choice across five unrelated things),
*"How do you find alternatives today?"* (free text), *"Would you trust AI?"*.

**Coverage matrix** (the ten things this product must learn):

| need | why it matters | v1 | v2 |
|---|---|---|---|
| N1 · Is refusal acceptable, or does it feel like a broken tool? | the entire thesis | ✗ | ✓ `refuse`, `q_refuse` |
| N2 · Is 1 hop the right cap? | coverage vs safety | ✗ | ✓ `hops`, `q_hops` |
| N3 · Who pays? | sales route | partial | ✓ `payer` |
| N4 · Will a GP accept a message, not a call? | workflow | ✗ | ✓ `gp` |
| N5 · Is `onbekend` tolerable in practice? | the honest failure mode | ✗ | ✓ `unknown`, `q_unknown` |
| N6 · How long does a case actually take? | the €-value claim | partial | ✓ `q_minutes` |
| N7 · What is the real first frustration? | positioning vs search engine | ✗ | ✓ `q_first` |
| N8 · Does the pharmacist trust the *rules*, or the vendor? | adoption | ✗ | ✓ `q_trust` |
| N9 · Patient acceptance of B1 explanation | last mile | ✗ | ✓ `patient` |
| N10 · What would make them stop using it? | churn | ✗ | ✓ `q_stop` |

**v1: 2.0/10. v2: 9.5/10.** Show the table.

### 12.2 The 14 items

```
A · Rol
 1 role      single [openbaar apotheker, apothekersassistent, ketenapotheker, ziekenhuisapotheker,
                     huisarts, patiënt, verzekeraar, groothandel, inspectie, import/bereiding]
 2 setting   single [zelfstandig, keten, ziekenhuis, anders]
 3 years     single [<2, 2-5, 6-15, >15]

B · Het werk van vandaag  (v1 is blind here)
 4 q_minutes single "Hoeveel tijd kost één tekortgeval u gemiddeld?"
              [<5 min, 5-15, 15-30, 30-60, >60, weet niet]
 5 q_first   single "Wat is bij een tekort uw eerste probleem?"
              [beschikbaarheid vinden, wet- en regelgeving, vergoeding, de huisarts bereiken,
               de patiënt uitleggen, administratie, niets]
 6 q_refuse  scale 5 "Als een systeem twijfelt, moet het dan weigeren of een beste gok doen?"
              (1 = altijd een gok, 5 = altijd weigeren)
 7 q_unknown single "Wat moet een systeem doen als de vergoeding onbekend is?"
              [onbekend tonen, aannemen dat het vergoed is, niets tonen, anders]

C · De vier ideeën (neutrale taal, nooit "AI")
 8 usefulness matrix 5 rows:
   [ketens      "Kant-en-klare substitutieketens met de regels erbij",
    weigeringen "Een zichtbare lijst met afgewezen ketens en de reden",
    brieven     "Een huisartsenbericht en patiëntuitleg op B1",
    import      "Importroute met de buitenlandse registratie erbij"]
 9 q_hops    single "Hoeveel wijzigingen mag een voorstel doen?" [1, 2, 3, maakt niet uit]
10 q_trust   single "Wat maakt een substitutievoorstel betrouwbaar?"
              [de apotheker die het goedkeurt, de geciteerde bron, de leverancier, de inspectie]
11 q_gp      single "Hoe wil de huisarts bericht krijgen over een substitutie?"
              [telefonisch, bericht in het HIS, e-mail, niet]

D · Gebruik
12 intent    scale 10 "Hoe waarschijnlijk gebruikt u dit volgende maand?"
13 patient   scale 5  "Hoe belangrijk is uitleg op B1-niveau bij een substitutie?"   (patiënt + apotheek)
14 q_stop    single "Wat zou u ervan weerhouden?"
              [vertrouwen in de regels, werkdruk, integratie met het AIS, kosten, niets]
```

Every sensitive item gets a `zeg ik liever niet` path; abstentions are counted per archetype and reported.

### 12.3 Agent answering
Deterministic mapping from the agent's opinion to the answer (no model): `likert5(o) = clamp(1+round(o*4))`,
options carry an `align: "left" | "right" | null`, `abstain_probability = 0.06 + 0.30*(1 - o.unknown)`.
`q_minutes` for pharmacists is drawn from their `pharmacy_type` (chain faster, independent slower) so the
population's time answer is traceable to a persona fact, not asserted.

---

## 13. Findings that must be able to contradict the pitch

### 13.1 The falsifiers — commit `data/swarm/falsifiers.json` **before** the first ensemble run

```json
[
  {"id":"F1","claim":"Pharmacists prefer a visible refusal over a confident guess.","test":"QREFUSE","expected":true,
   "if_false":"The whole product is wrong: a tool that refuses is a tool they turn off. Rebuild around ranked confidence with a mandatory human check on every line."},
  {"id":"F2","claim":"The 1-hop cap survives a public dispensing error.","test":"QFOUT","expected":true,
   "if_false":"One incident collapses the coverage argument. The cap becomes a configurable protocol, not a product rule."},
  {"id":"F3","claim":"Pharmacists tolerate 'onbekend'.","test":"QUNKNOWN","expected":true,
   "if_false":"We must resolve every reimbursement status or the product cannot ship. That means licensed insurer feeds and a much slower first version."},
  {"id":"F4","claim":"GPs accept a message instead of a call.","test":"QGP","expected":true,
   "if_false":"The GP message is decorative. The workflow promise shrinks to the pharmacy's four walls."},
  {"id":"F5","claim":"The supply side and the regulator disagree about coverage more than pharmacists do.","test":"DIVERGE","expected":true,
   "if_false":"Our story about being 'between the wholesaler and the inspector' is wrong and must not be told."}
]
```
`DIVERGE` is computed from the archetype means: `|wholesaler.hops − regulator.hops| > 0.25`.

### 13.2 The finding you must surface, even though it undercuts the pitch

`wholesaler` (n=18) and `import` (n=8) push `hops` **up**; `regulator` (n=10) pushes `refuse` **up** and places
`hops` below the pharmacist mean. So on any run where the `fout` or `ai_fout` event fires, the population
splits and the **1-hop majority among pharmacists is fragile**. Report it plainly:

> *"In 78 of 200 runs (p = 0.390, 95% CI 0.325–0.459) a majority of pharmacists still wanted the one-hop cap
> after a dispensing-error story. Our rule survives, but barely — and the group pushing against it is our own
> supply chain, which is also our sales channel. That is a conflict we have not resolved."*

That last clause is the sentence that wins the FairTech mark. Do not soften it.

### 13.3 Report structure
1. What the population is (240, ten archetypes, the prior table).
2. What it is not (the four honesty lines).
3. The six frequencies as `x / n runs (p, CI)`.
4. Falsifier table, fired / not fired, and the action each implies.
5. Three findings in plain language.
6. *"Wat dit niet zegt."*

---

## 14. Guardrails, evaluation, what not to claim

### 14.1 Test set (`data/cases.json`, 30 cases)
- **10** with a same-strength, same-form alternative (must produce ≥1 `geldig`).
- **10** needing a strength or package change (must produce ≥1 `geldig`, `hop = 1`, with the equivalence note).
- **10** with **no safe chain** (cross-substance need, unresolved paediatric, unmet import citation, renal
  contraindication, unknown substance). **These must return zero `geldig` chains (`T-20`)** — they are the
  demo's money shot.
- Plus **5** cases with patient flags to exercise `P-CI-01`/`P-PAEDI-01`.

Each case fixture carries `expected: { valid_min: n, valid_max: n, must_reject_rules: [...] }`.

### 14.2 Metrics printed on screen
| Metric | Target | How |
|---|---|---|
| Chain validity (every proposed chain passes a cited rule) | 100% | `T-09`, `T-12` |
| Coverage (cases with ≥1 valid chain) | ≥ 70% on the 30 | computed |
| Unsafe proposals reaching the screen | **0** | `T-20` + `T-19` |
| Time per case | < 4 min vs 20–45 baseline | stopwatch, shown as a tile |
| Reimbursement accuracy | exact match with the snapshot on 20 cases | `T-11` |
| Refusal quality | every sentence > 25 chars and rule-cited | `T-09` |

### 14.3 Never say
- ❌ "We find an alternative in 99% of cases." Say: *"availability is solved elsewhere; we make the swap legal,
  reimbursed and safe, and we refuse when we cannot."*
- ❌ "Clinically validated." Say: *"substitution information for a pharmacist; the pharmacist decides."*
- ❌ "Not a medical device." Say: *"we would seek a classification opinion before scaling."*
- ❌ "Guaranteed reimbursement." Say: *"volgens de preferentielijst van {verzekeraar}, peildatum {datum}."*
- ❌ "The simulation shows pharmacists want this." Say: *"the simulated population, whose priors are on screen."*

---

## 15. Energy and sovereignty

**kWh per 1,000 cases: ≈ 1.0 kWh (warm cache), ≈ 2.6 kWh (cold).** Show both, and say which is which.
- Per case you read a handful of SmPC sections plus one preference-list entry: ~4–8k tokens in, ~400 out.
- SmPC text rarely changes, so a cache keyed on the SmPC sha256 makes the warm path almost free. **That is the
  product decision**: cache by document hash, invalidate on hash change.
- Cold path is dominated by document ingestion (a full SmPC is ~40–80k tokens). Ingest once per product per
  SmPC revision.

**Sovereignty, verbatim:** *"The rules are a table we own and can read on paper; the sources are EU public
documents (CBG/EMA SmPC, insurer preference lists); the model only reads documents into fields and is
swappable; the pharmacist's approval is the only thing that can produce a document. If we disappear, the
pharmacy keeps the audit log and the rule table and can still explain every decision."*

---

## 16. The demo (90 seconds) and the pitch

### 16.1 The 90-second script
1. **0:00** Two numbers: *"26,000 shortages a day. 96 days each. One FTE per pharmacy."* Then the reframe:
   *"Availability is solved. The work is not."*
2. **0:12** Name the enemy yourself: *"geneesmiddelentekort.nl exists, hospitals use it, and the minister says
   an alternative exists 99% of the time. Both true. Here is the 45 minutes nobody has automated."*
3. **0:25** Open case **C-017** (a no-safe-chain case). Chains appear; **three are refused.** Read the refusal
   aloud, slowly: *"Salbutamol 2 mg/5 ml drank heeft een ander dosisinterval — niet uitwisselbaar zonder
   controle."* **Pause.** *"That sentence is the product."*
4. **0:45** Open case **C-004** (strength change). Show the reimbursement line: `onbekend` in amber with the
   insurer and the peildatum. *"Onbekend is a valid answer here, and it is never green."*
5. **1:00** Approve one chain. The GP message and the B1 patient text appear from the same decision.
6. **1:10** Show the audit log: rule ids, source hashes, who approved. *"This is what an IGJ inspector asks
   for."*
7. **1:25** Swarm: fire `fout`. *"One dispensing error and the one-hop majority nearly collapses — and the group
   pushing against our cap is the wholesaler, which is also our sales channel."*
8. **1:35** End on the frequency and the unresolved conflict.

### 16.2 The five slides
| # | Headline | Copy |
|---|---|---|
| 1 · Claim | **Availability is solved. The work is not.** | 26,000 shortages a day · 96 days each · ~1 FTE per pharmacy |
| 2 · Demo | **Three chains, one refused with a reason a pharmacist would say out loud.** | The refusal column is the safety feature. |
| 3 · Why AI | **SmPC texts, preference lists and import rules are unstructured documents that change yearly.** | The model reads. The rules decide. The pharmacist approves. |
| 4 · FairTech | **No cross-substance swap, ever. `onbekend` is never green. Every refusal cites a rule.** | The human is not in the loop as a formality; the human is the only exit. |
| 5 · Venture | **€150–400 per pharmacy per month against ~€70k of pharmacist time.** | Sold through chains and wholesalers. |

### 16.3 Jury Q&A — exact answers

**"Doesn't the national search engine already do this?"**
> It finds which pharmacy has stock, and almost every hospital uses it. We answer the next question: is the
> swap legal, is it reimbursed, and is it safe for this patient.

**"The minister says 99%."**
> Then the pain is the work — 96 days per shortage, one FTE per pharmacy, 46% of affected patients reporting
> deterioration. We quote both numbers and explain why they coexist.

**"Could you cause a dosing error?"**
> Every chain is checked against the SmPC and the patient's flags. A cross-substance swap is impossible by
> construction — there is no code path for it — and the pharmacist approves each line. Our test set contains
> ten cases with no safe answer, and the system returns zero valid chains on all ten.

**"Is this a medical device?"**
> As scoped it is substitution *information* for a pharmacist, not diagnosis or treatment advice. We would seek
> a classification opinion before scaling, and we say that rather than claiming an exemption.

**"Where do you get shortage data?"**
> We don't depend on any licensed feed. Any notice format goes through the same logic. Farmanco is an
> integration, not a dependency, and we never claim completeness because reporting is voluntary.

**"What have you not solved?"**
> That capping at one hop is a clinical judgement we have encoded as a product rule. It is defensible and
> documented, and a pharmacist may disagree — and when they do, the tool is wrong and the patient is not.

**"Your sales channel is your critic."**
> Yes. Our own simulation shows the wholesalers and importers want more substitution while the regulator wants
> more refusal. We have not resolved that, and it is the first thing we would test with a real pharmacy.

---

## 17. 36-hour plan

**Day 1**
- 08:30–09:00 scaffold, fonts, tokens, footer line.
- 09:00–10:00 `types.ts` + `hashchain.ts` + tests `T-15`, `T-16`.
- 10:00–12:00 **`data/substances.json` for 20 substances** — the hardest, most valuable block. Get the
  equivalence table right; it is what a pharmacist will argue with, and that argument is the demo.
- 12:00–12:45 `data/cases.json` (30) + `data/notices/` + `data/patients.json`.
- 12:45–14:00 `chains.ts` + `gate.ts`; wire `T-19`, `T-20`, `T-09`, `T-12`.
- 14:00–15:00 `refusals.ts` — write all nine sentences in Dutch, carefully.
- 15:00–16:15 the three-column screen + approval + edits.
- 16:15–17:00 **find a pharmacist** (there will be one in the room). Argue about the equivalence table. Fix it
  tonight, in the data, not in the algorithm.

**Day 2**
- 09:00–10:15 `letters.ts` (GP message + B1 text) + print page.
- 10:15–12:00 swarm: rng, archetypes, personas, engine; print the six frequencies to the console.
  **Commit `falsifiers.json` before this run.**
- 12:00–13:00 `SwarmCanvas` + play/scrub/fire/levers + Report tab. `npm test`. Full QA (§18).
- **13:00 freeze.**
- 13:30–13:50 rehearse twice, out loud, on the clock.
- 13:50 pitch.

**Cut order if behind:** CSV export → the 20th substance → `q_gp` item → the ninth event.
**Never cut:** the refusal column, the zero-valid-chain cases, `onbekend` rendering, the falsifiers, the CIs.

---

## 18. Acceptance criteria — machine-checkable

```bash
npm run build                       # 0
npm test                            # T-01..T-20 green
npx tsx scripts/verify-chain.ts     # total=N verified=N brokenAt=null
```

| # | Criterion | Check |
|---|---|---|
| A1 | 0 console page errors on `/`, `/case/C-004`, `/case/C-017`, `/case/C-004/print`, `/verify`, `/swarm` | Playwright `pageerror` |
| A2 | 0 horizontal overflow at 390 px and 1440 px on every route | `scrollWidth - clientWidth === 0` |
| A3 | No nested anchors | `document.querySelectorAll('a a').length === 0` |
| A4 | The refusal column is visible **without any interaction** on a case with refusals | count of `[data-refusal]` > 0 at first paint |
| A5 | Zero valid chains on the 10 no-safe-chain cases | `T-20` |
| A6 | `onbekend` never renders as `vergoed` | `T-11` |
| A7 | Export without approval → 409 `E-APPROVAL-01` | API test |
| A8 | Chain tamper demo: `brokenAt === 7` → reset → `null` | API test |
| A9 | ≥6 frequencies rendered matching `/\d+ \/ \d+ runs \(p = 0\.\d{3}, 95% CI 0\.\d{3}–0\.\d{3}\)/` | regex on the Report tab |
| A10 | Four honesty strings present | `GEEN LLM`, `SYNTHETISCH`, `GEEN VOORSPELLING`, `PRIOREN ZIJN AANNAMES` |
| A11 | ≥1 falsifier fired against the pitch | Report tab |
| A12 | Every rendered field has `data-source` and `data-date` | DOM scan (`T-12`) |
| A13 | Works offline | DevTools offline → reload → still runs |
| A14 | Swarm ≥ 55 fps at 240 nodes, and the number is printed on screen | in-browser measurement |

---

## 19. Sources (2026)

- **Scale and cost:** NRC, March 2026, on KNMP data — **26,000** shortage notifications a day, **3.5 million**
  Dutch people affected (1 in 3 users), **1,134** medicines temporarily or long-term unavailable, average
  shortage **~96 days**, cost **~1 FTE per pharmacy** (**2,000 FTE** nationally, **€220 million/year**),
  **74%** of shortages hitting preference-policy drugs, supplier count per drug **3.3 (2016) → 2.6 (2025)**.
- **Patients:** LEF + SIR Instituut Meldweek 2026 via ANP, 9 Nov 2026 — **46%** of affected patients report
  health deterioration, **6 in 10** must return to the pharmacy or doctor, **1 in 3** leaves empty-handed.
- **Substitution coverage:** KNMP *Geneesmiddelentekorten 2025* (Jan 2026) — **~75%** of shortages coverable by
  a product with the same active substance.
- **The 99% statement:** answer of Minister Hermans to parliament, 11 March 2026, citing KNMP data that an
  alternative is available in the pharmacy in **99%** of supply problems.
- **Incumbents:** `geneesmiddelentekort.nl` (used by ~95% of Dutch hospitals); **KNMP Farmanco** (€450/yr for
  pharmacies without a KNMP package, €2,064/yr for non-pharmacy organisations), voluntary reporting;
  **Pharme/Mosadex** alternative service; **GIP/Z-index** product and price databank.
- **Rules:** SmPC texts (CBG/EMA), the *tekortenbesluit* import rules (wetten.overheid.nl, IGJ), each insurer's
  *preferentiebeleid* (CZ, VGZ, Menzis).

> **The preference lists and SmPC extracts in the demo are synthetic-but-realistic snapshots, clearly labelled
> with a source name and a peildatum.** They exist to make the rules engine demonstrable. On screen, every one
> carries: `voorbeelddata — geen officiële lijst`. Never present a snapshot as the current list.
