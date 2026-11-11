export type Route = "nl_geregistreerd" | "import" | "bereiding";
export type Verdict = "geldig" | "afgewezen" | "onbekend";
export type Reimbursement = "vergoed" | "niet_vergoed" | "onbekend";
export type PatientFlag =
  | "renaal"
  | "zwangerschap"
  | "pediatrisch"
  | "allergie_penicilline"
  | "allergie_nsaid"
  | "leverfunctie";

export interface SourceRef {
  doc: string;
  field: string;
  date: string;
  sha256: string;
  quote_nl?: string;
}

export interface Case {
  case_id: string;
  substance: string;
  atc: string;
  strength: string;
  form: string;
  package: string;
  patient_flags: PatientFlag[];
  insurer: "CZ" | "VGZ" | "Menzis" | "onbekend";
  notice_ref: string | null;
  age_band: "0-11" | "12-17" | "18-64" | "65+";
  allow_two_hops?: boolean;
  therapeutic_need?: boolean;
  expected?: {
    valid_min: number;
    valid_max: number;
    must_reject_rules: string[];
  };
}

export interface Product {
  product: string;
  substance: string;
  strength: string;
  form: string;
  packages: string[];
  nl_registered: boolean;
  eu_registered: boolean;
  foreign_registration: string | null;
  adult_only: boolean;
  contra_indications: Partial<Record<PatientFlag, boolean>>;
  smpc_ref: string;
  source: SourceRef;
}

export interface Substance {
  substance: string;
  atc: string;
  products: Product[];
  dose_interval_equivalence: Record<
    string,
    { equivalent: boolean; rule: "P-STR-01" | "P-STR-02"; note_nl: string }
  >;
  contra_indications: Partial<Record<PatientFlag, boolean>>;
  source: SourceRef;
}

export type SubstanceTable = Record<string, Substance>;

export interface ChainLink {
  substance: string;
  product: string;
  strength: string;
  form: string;
  package: string;
  route: Route;
  foreign_registration: string | null;
  hop: 0 | 1;
  source: SourceRef;
}

export interface ChainVerdict {
  chain_id: string;
  chain: ChainLink[];
  status: Verdict;
  rules_passed: string[];
  reject_rule: string | null;
  reject_reason_nl: string | null;
  // English gloss of the Dutch refusal sentence (UI aid only; the Dutch
  // sentence remains the authoritative clinical document).
  reject_reason_en?: string | null;
  secondary_rules: string[];
  reimbursement: Reimbursement;
  reimbursement_source: { insurer: string; list: string; peildatum: string } | null;
  sources: SourceRef[];
  equivalence_note_nl?: string;
  equivalence_note_en?: string;
}

export interface Edit {
  field: "chain" | "patient_text" | "gp_message" | "reimbursement";
  from: string;
  to: string;
  by: string;
  at: string;
  note_nl: string | null;
}

declare const approvalToken: unique symbol;
export type Unapproved = { readonly _unapproved: unique symbol };
export type Approved = {
  readonly [approvalToken]: true;
  readonly chain_id: string;
  readonly by: string;
  readonly at: string;
};

export function createApproval(chain_id: string, by: string, at: string): Approved {
  if (!chain_id || !by.trim() || !at) throw new Error("E-APPROVAL-01");
  return { chain_id, by: by.trim(), at } as Approved;
}

export interface SubstitutionAdvice {
  case: Case;
  chains: ChainVerdict[];
  top: string | null;
  refusals: ChainVerdict[];
  gp_message_nl: string;
  patient_text_nl: string;
  // English glosses of the Dutch letters (UI reading aid only; cleared if the
  // pharmacist edits the Dutch text).
  gp_message_en?: string;
  patient_text_en?: string;
  needs_pharmacist: true;
  approved: { chain_id: string; by: string; at: string; edits: Edit[] } | null;
}

export interface AuditRow {
  seq: number;
  ts: string;
  actor: string;
  action:
    | "CASE_OPENED"
    | "CHAINS_GENERATED"
    | "CHAIN_REJECTED"
    | "CHAIN_APPROVED"
    | "EDIT_MADE"
    | "ADVICE_EXPORTED"
    | "DEMO_RESET";
  subject: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  hash: string;
}
