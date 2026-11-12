export const RULES = {
  "P-SUB-01": "Nooit een andere werkzame stof voorstellen",
  "P-CI-01": "Geen onopgeloste contra-indicatie bij patiëntkenmerken",
  "P-PAEDI-01": "Geen volwassenvorm bij een pediatrische casus",
  "P-STR-02": "Maximaal één wijziging zonder uitbreiding door de apotheker",
  "P-STR-01": "Dosisinterval moet behouden blijven",
  "P-IMPORT-01": "Import alleen met citeerbare buitenlandse registratie",
  "P-REIMB-01": "Vergoeding moet uit een actuele momentopname blijken",
  "P-SOURCE-01": "Elk getoond veld heeft een bron en peildatum",
  "P-NOSEND-01": "Het systeem verstuurt niets",
  "P-UNKNOWN-01": "Een onbekende stof wordt nooit geraden",
} as const;

// English labels for display. RULES (Dutch) remains the authoritative table.
export const RULES_EN = {
  "P-SUB-01": "Never propose a different active substance",
  "P-CI-01": "No unresolved contraindication for patient flags",
  "P-PAEDI-01": "No adult-only form for a paediatric case",
  "P-STR-02": "At most one change without pharmacist extension",
  "P-STR-01": "The dose interval must be preserved",
  "P-IMPORT-01": "Import only with a citable foreign registration",
  "P-REIMB-01": "Reimbursement must come from a current snapshot",
  "P-SOURCE-01": "Every shown field has a source and a date",
  "P-NOSEND-01": "The system sends nothing",
  "P-UNKNOWN-01": "An unknown substance is never guessed",
} as const;

export type RuleId = keyof typeof RULES;
export const PRECEDENCE: RuleId[] = [
  "P-SUB-01", "P-CI-01", "P-PAEDI-01", "P-STR-02", "P-STR-01",
  "P-IMPORT-01", "P-REIMB-01", "P-SOURCE-01",
];
