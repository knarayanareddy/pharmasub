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

export type RuleId = keyof typeof RULES;
export const PRECEDENCE: RuleId[] = [
  "P-SUB-01", "P-CI-01", "P-PAEDI-01", "P-STR-02", "P-STR-01",
  "P-IMPORT-01", "P-REIMB-01", "P-SOURCE-01",
];
