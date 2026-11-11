import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/",
}));

import { AppShell } from "@/components/AppShell";
import { ChainCard } from "@/components/ChainCard";
import { RefusalRow } from "@/components/RefusalRow";
import { cases } from "@/domain/data";
import { buildAdvice, withApproval } from "@/domain/engine";
import { createApproval } from "@/domain/types";
import { DICTIONARIES, FALSIFIERS_EN, fill, getDictionary, isLang } from "@/i18n/dictionary";
import { LanguageProvider } from "@/i18n/LanguageProvider";

const advices = cases.map(buildAdvice);

describe("Tweetalig (NL/EN) ondersteuning en uitleg", () => {
  test("NL en EN woordenboeken hebben exact dezelfde sleutels en placeholders", () => {
    const nlKeys = Object.keys(DICTIONARIES.nl).sort();
    const enKeys = Object.keys(DICTIONARIES.en).sort();
    expect(enKeys).toEqual(nlKeys);

    const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of nlKeys) {
      const k = key as keyof typeof DICTIONARIES.nl;
      expect(DICTIONARIES.nl[k].length).toBeGreaterThan(0);
      expect(DICTIONARIES.en[k].length).toBeGreaterThan(0);
      expect(placeholders(DICTIONARIES.en[k])).toEqual(placeholders(DICTIONARIES.nl[k]));
    }

    expect(isLang("nl")).toBe(true);
    expect(isLang("en")).toBe(true);
    expect(isLang("de")).toBe(false);
    expect(fill("Hello {name} ({n})", { name: "World", n: 3 })).toBe("Hello World (3)");
    expect(Object.keys(FALSIFIERS_EN)).toEqual(["F1", "F2", "F3", "F4", "F5"]);
    expect(getDictionary("en").nav_cases).toBe("Cases");
    expect(getDictionary("nl").nav_cases).toBe("Casussen");
  });

  test("iedere weigering en geldige sterkte/vorm-keten heeft een Engelse uitleg naast het Nederlands", () => {
    for (const advice of advices) {
      for (const refusal of advice.refusals) {
        expect((refusal.reject_reason_nl || "").length).toBeGreaterThan(20);
        expect((refusal.reject_reason_en || "").length).toBeGreaterThan(20);
      }
      for (const valid of advice.chains.filter((c) => c.status === "geldig")) {
        if (valid.equivalence_note_nl) {
          expect((valid.equivalence_note_en || "").length).toBeGreaterThan(15);
        }
      }
    }
  });

  test("withApproval behoudt Nederlandse documenten, voegt Engelse uitleg toe, en wist die na bewerking", () => {
    const c004 = cases.find((c) => c.case_id === "C-004")!;
    const base = buildAdvice(c004);
    expect(base.gp_message_nl).toBe("");
    expect(base.gp_message_en).toBe("");
    expect(base.patient_text_nl).toBe("");
    expect(base.patient_text_en).toBe("");

    const validChain = base.chains.find((c) => c.status === "geldig")!;
    const approval = createApproval(validChain.chain_id, "AP-TEST", "2026-11-11T10:00:00Z");

    const approved = withApproval(base, approval);
    expect(approved.gp_message_nl).toContain("Geachte collega");
    expect(approved.gp_message_en).toContain("Dear colleague");
    expect(approved.patient_text_nl).toContain("Uw apotheek");
    expect(approved.patient_text_en).toContain("Your pharmacy");

    const edited = withApproval(base, approval, [
      {
        field: "gp_message",
        from: approved.gp_message_nl,
        to: "Aangepaste tekst voor de huisarts.",
        by: "AP-TEST",
        at: "2026-11-11T10:05:00Z",
        note_nl: "Tekst aangepast",
      },
    ]);
    expect(edited.gp_message_nl).toBe("Aangepaste tekst voor de huisarts.");
    expect(edited.gp_message_en).toBe("");
    expect(edited.patient_text_en).toContain("Your pharmacy");
  });

  test("RefusalRow en ChainCard tonen in EN-modus zowel Nederlands origineel als Engelse gloss", () => {
    const c004 = cases.find((c) => c.case_id === "C-004")!;
    const advice = buildAdvice(c004);
    const refusal = advice.refusals[0];
    const valid = advice.chains.find((c) => c.status === "geldig" && c.equivalence_note_nl) || advice.chains.find((c) => c.status === "geldig")!;

    const htmlNl = renderToStaticMarkup(
      <LanguageProvider initialLang="nl">
        <RefusalRow verdict={refusal} index={0} />
      </LanguageProvider>,
    );
    expect(htmlNl).toContain(refusal.reject_reason_nl!);
    expect(htmlNl).not.toContain("en-gloss");

    const htmlEn = renderToStaticMarkup(
      <LanguageProvider initialLang="en">
        <RefusalRow verdict={refusal} index={0} />
        <ChainCard verdict={valid} rank={1} selected={false} onSelect={() => {}} />
      </LanguageProvider>,
    );
    expect(htmlEn).toContain(refusal.reject_reason_nl!);
    expect(htmlEn).toContain(refusal.reject_reason_en!);
    expect(htmlEn).toContain("English gloss");
    expect(htmlEn).toContain("VALID");
  });

  test("AppShell toont taalschakelaar en tweetalige navigatie", () => {
    const htmlEn = renderToStaticMarkup(
      <LanguageProvider initialLang="en">
        <AppShell><div>content</div></AppShell>
      </LanguageProvider>,
    );
    expect(htmlEn).toContain("lang-toggle");
    expect(htmlEn).toContain("Swarm lab");
    expect(htmlEn).toContain("Audit &amp; sources");
    expect(htmlEn).toContain("Demo — synthetische casussen.");
    expect(htmlEn).toContain("Demo — synthetic cases.");
  });
});
