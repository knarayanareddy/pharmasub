import { substanceTable } from "./data";
import type { Case, PatientFlag } from "./types";

const flags: PatientFlag[] = ["renaal", "zwangerschap", "pediatrisch", "allergie_penicilline", "allergie_nsaid", "leverfunctie"];
const forms = [...new Set(Object.values(substanceTable).flatMap((substance) => substance.products.map((product) => product.form)))].sort((a, b) => b.length - a.length);

export interface NoticeExtraction {
  substance: string | null;
  strength: string | null;
  form: string | null;
  package: string | null;
  insurer: Case["insurer"] | null;
  fields_found: number;
}

export function parseNotice(text: string): NoticeExtraction {
  const normalized = text.toLowerCase();
  const substance = Object.keys(substanceTable).filter((name) => normalized.includes(name)).sort((a, b) => b.length - a.length)[0] || null;
  const strength = text.match(/\d+(?:[.,]\d+)?(?:\/\d+)?\s*(?:mcg|mg\/5 ml|mg\/ml|mg|g|E\/ml)/i)?.[0] || null;
  const form = forms.find((item) => normalized.includes(item.toLowerCase())) || (normalized.includes("aerosol") ? "aerosol" : null);
  const packageName = text.match(/\d+\s*(?:doses|tabletten|capsules|zetpillen|pennen|ml)/i)?.[0] || null;
  const insurer = (["CZ", "VGZ", "Menzis"] as const).find((name) => new RegExp(`\\b${name}\\b`, "i").test(text)) || null;
  return { substance, strength, form, package: packageName, insurer, fields_found: [substance, strength, form, packageName, insurer].filter(Boolean).length };
}

export function customCaseId(c: Omit<Case, "case_id" | "atc" | "expected">): string {
  const input = JSON.stringify(c);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `X-${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

export function normalizeCase(input: unknown): Case | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const text = (key: string) => typeof value[key] === "string" && String(value[key]).length <= 120 ? String(value[key]) : null;
  const case_id = text("case_id"), substance = text("substance"), strength = text("strength"), form = text("form"), packageName = text("package");
  if (!case_id || !/^X-[A-Z0-9-]+$/.test(case_id) || !substance || !strength || !form || !packageName) return null;
  const insurer = ["CZ", "VGZ", "Menzis", "onbekend"].includes(String(value.insurer)) ? value.insurer as Case["insurer"] : null;
  const age_band = ["0-11", "12-17", "18-64", "65+"].includes(String(value.age_band)) ? value.age_band as Case["age_band"] : null;
  if (!insurer || !age_band || !Array.isArray(value.patient_flags) || !value.patient_flags.every((flag) => flags.includes(flag))) return null;
  return {
    case_id, substance: substance.toLowerCase(), atc: substanceTable[substance.toLowerCase()]?.atc || "ONBEKEND",
    strength, form, package: packageName, patient_flags: [...value.patient_flags], insurer,
    notice_ref: null, age_band,
    ...(value.therapeutic_need === true ? { therapeutic_need: true } : {}),
    ...(value.allow_two_hops === true ? { allow_two_hops: true } : {}),
  };
}
