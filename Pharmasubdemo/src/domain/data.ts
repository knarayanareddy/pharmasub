import substancesJson from "@data/substances.json";
import casesJson from "@data/cases.json";
import czJson from "@data/preference/2026-cz.json";
import vgzJson from "@data/preference/2026-vgz.json";
import menzisJson from "@data/preference/2026-menzis.json";
import type { Case, SubstanceTable } from "./types";

export const substanceTable = substancesJson as unknown as SubstanceTable;
export const cases = casesJson as Case[];
export const preferences = { CZ: czJson, VGZ: vgzJson, Menzis: menzisJson };

export function getCase(caseId: string): Case | undefined {
  return cases.find((item) => item.case_id === caseId);
}
