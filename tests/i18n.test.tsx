import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/",
}));

import { AppShell } from "@/components/AppShell";
import { AuditExplorer } from "@/components/AuditExplorer";
import { CaseExplorer } from "@/components/CaseExplorer";
import { ChainCard } from "@/components/ChainCard";
import { HomeView } from "@/components/HomeView";
import { InstrumentView } from "@/components/InstrumentView";
import { NotFoundView } from "@/components/NotFoundView";
import { PrintView } from "@/components/PrintView";
import { RefusalRow } from "@/components/RefusalRow";
import { VerifyView } from "@/components/VerifyView";
import { cases } from "@/domain/data";
import { buildAdvice, withApproval } from "@/domain/engine";
import { parseNotice } from "@/domain/intake";
import { createApproval } from "@/domain/types";
import { DICTIONARIES, FALSIFIERS_EN, fill, getDictionary, isLang, langFromRequest } from "@/i18n/dictionary";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import {
  canonicalForm,
  canonicalPackage,
  canonicalStrength,
  canonicalSubstance,
  translateActor,
  translateAtc,
  translateForm,
  translateInsurer,
  translateNoticeText,
  translatePackage,
  translatePatientCondition,
  translatePharmacyType,
  translateProduct,
  translateRoute,
  translateSourceDoc,
  translateStrength,
  translateSubstance,
} from "@/i18n/translateData";

const advices = cases.map(buildAdvice);

describe("Tweetalig (NL/EN) volledige vertaling", () => {
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

    expect(langFromRequest(new Request("http://local/api/export/C-004?lang=en"))).toBe("en");
    expect(langFromRequest(new Request("http://local/api/export/C-004", { headers: { cookie: "samenstelling-lang=en" } }))).toBe("en");
    expect(langFromRequest(new Request("http://local/api/export/C-004"))).toBe("nl");
  });

  test("iedere weigering, equivalentienotitie en brief heeft volledig vertaald Engels zonder Nederlandse resttermen", () => {
    for (const advice of advices) {
      for (const refusal of advice.refusals) {
        expect((refusal.reject_reason_nl || "").length).toBeGreaterThan(20);
        expect((refusal.reject_reason_en || "").length).toBeGreaterThan(20);
        expect(refusal.reject_reason_en).not.toMatch(/\b(inhalatiepoeder|zetpil|injectievloeistof|drank|onbekend|E\/ml)\b/i);
      }
      for (const valid of advice.chains.filter((c) => c.status === "geldig")) {
        if (valid.equivalence_note_nl) {
          expect((valid.equivalence_note_en || "").length).toBeGreaterThan(15);
        }
      }
    }

    const c004 = cases.find((c) => c.case_id === "C-004")!;
    const base = buildAdvice(c004);
    const validChain = base.chains.find((c) => c.status === "geldig")!;
    const approval = createApproval(validChain.chain_id, "AP-TEST", "2026-11-11T10:00:00Z");

    const approved = withApproval(base, approval);
    expect(approved.gp_message_nl).toContain("Geachte collega");
    expect(approved.gp_message_en).toContain("Dear colleague");
    expect(approved.gp_message_en).toContain("inhalation powder");
    expect(approved.gp_message_en).not.toContain("inhalatiepoeder");
    expect(approved.patient_text_nl).toContain("Uw apotheek");
    expect(approved.patient_text_en).toContain("Your pharmacy");

    const edited = withApproval(base, approval, [
      {
        field: "gp_message",
        from: approved.gp_message_nl,
        to: "Custom pharmacist text.",
        by: "AP-TEST",
        at: "2026-11-11T10:05:00Z",
        note_nl: "Tekst aangepast",
      },
    ]);
    expect(edited.gp_message_nl).toBe("Custom pharmacist text.");
    expect(edited.gp_message_en).toBe("");
    expect(edited.patient_text_en).toContain("Your pharmacy");
  });

  test("parseNotice herkent zowel Nederlandse als Engelse tekortmeldingen", () => {
    const nlParsed = parseNotice("Salbutamol CF 100 mcg inhalatiepoeder, 200 doses. Verzekeraar: CZ.");
    const enParsed = parseNotice("Salbutamol CF 100 mcg inhalation powder, 200 doses. Insurer: CZ.");
    expect(enParsed).toEqual(nlParsed);

    const enIns = parseNotice("Insulin glargine Demo 100 IU/ml solution for injection, 5 pens. Insurer: VGZ.");
    expect(enIns).toMatchObject({
      substance: "insuline glargine",
      strength: "100 E/ml",
      form: "injectievloeistof",
      package: "5 pennen",
      insurer: "VGZ",
      fields_found: 5,
    });
  });

  test("RefusalRow, ChainCard, CaseExplorer en AuditExplorer tonen in EN-modus alleen Engels en in NL-modus alleen Nederlands", () => {
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
    expect(htmlNl).not.toContain(refusal.reject_reason_en!);

    const htmlEn = renderToStaticMarkup(
      <LanguageProvider initialLang="en">
        <RefusalRow verdict={refusal} index={0} />
        <ChainCard verdict={valid} rank={1} selected={false} onSelect={() => {}} />
        <CaseExplorer items={[{
          case_id: "C-011",
          substance: "insuline glargine",
          atc: "A10AE04",
          strength: "100 E/ml",
          form: "injectievloeistof",
          insurer: "onbekend",
          flags: [],
          valid: 0,
          refused: 3,
          scenario: "geen veilige keten",
        }]} />
        <AuditExplorer initial={{
          total: 1,
          verified: 1,
          brokenAt: null,
          rows: [{
            seq: 1,
            ts: "2026-11-10T08:00:00.000Z",
            actor: "synthetische-demo",
            action: "DEMO_RESET",
            subject: "audit",
            payload: { synthetic: true },
            prev_hash: "0".repeat(64),
            hash: "a".repeat(64),
          }],
        }} />
      </LanguageProvider>,
    );
    expect(htmlEn).not.toContain(refusal.reject_reason_nl!);
    expect(htmlEn).not.toContain("en-gloss");
    expect(htmlEn).not.toContain("English gloss");
    expect(htmlEn).toContain(refusal.reject_reason_en!);
    expect(htmlEn).toContain("VALID");
    expect(htmlEn).toContain("inhalation powder");
    expect(htmlEn).toContain("insulin glargine");
    expect(htmlEn).toContain("100 IU/ml");
    expect(htmlEn).toContain("solution for injection");
    expect(htmlEn).toContain("synthetic-demo");
    expect(htmlEn).not.toContain("synthetische-demo");
    expect(htmlEn).not.toContain("inhalatiepoeder");
    expect(htmlEn).not.toContain("injectievloeistof");
    expect(htmlEn).not.toContain("peildatum");
    expect(htmlEn).toContain("snapshot date");
  });

  test("AppShell toont taalschakelaar en zuiver NL of EN zonder duplicaattekst", () => {
    const htmlEn = renderToStaticMarkup(
      <LanguageProvider initialLang="en">
        <AppShell><div>content</div></AppShell>
      </LanguageProvider>,
    );
    expect(htmlEn).toContain("lang-toggle");
    expect(htmlEn).toContain("Swarm lab");
    expect(htmlEn).toContain("Audit &amp; sources");
    expect(htmlEn).not.toContain("Demo — synthetische casussen.");
    expect(htmlEn).not.toContain("niets wordt verzonden");
    expect(htmlEn).toContain("Demo — synthetic cases.");
    expect(htmlEn).toContain("P-NOSEND-01 · nothing is sent");

    const htmlNl = renderToStaticMarkup(
      <LanguageProvider initialLang="nl">
        <AppShell><div>inhoud</div></AppShell>
      </LanguageProvider>,
    );
    expect(htmlNl).toContain("Demo — synthetische casussen.");
    expect(htmlNl).toContain("P-NOSEND-01 · niets wordt verzonden");
    expect(htmlNl).not.toContain("Demo — synthetic cases.");
  });

  test("translateData vertaalt klinische termen en canonicaliseert terug voor intake", () => {
    expect(translateSubstance("amoxicilline/clavulaanzuur", "en")).toBe("amoxicillin/clavulanic acid");
    expect(canonicalSubstance("amoxicillin/clavulanic acid")).toBe("amoxicilline/clavulaanzuur");
    expect(translateForm("tablet met gereguleerde afgifte", "en")).toBe("modified-release tablet");
    expect(canonicalForm("modified-release tablet")).toBe("tablet met gereguleerde afgifte");
    expect(translateStrength("100 E/ml", "en")).toBe("100 IU/ml");
    expect(canonicalStrength("100 IU/ml")).toBe("100 E/ml");
    expect(translateStrength("0,4 mg", "en")).toBe("0.4 mg");
    expect(canonicalStrength("0.4 mg")).toBe("0,4 mg");
    expect(translatePackage("30 tabletten", "en")).toBe("30 tablets");
    expect(canonicalPackage("30 tablets")).toBe("30 tabletten");
    expect(translateProduct("Tamsulosine Sandoz 0,4 mg tablet met gereguleerde afgifte", "en")).toBe("Tamsulosin Sandoz 0.4 mg modified-release tablet");
    expect(translateSourceDoc("SmPC Insuline glargine Demo 100 E/ml injectievloeistof §4.2 · voorbeelddata — geen officiële lijst", "en")).toBe(
      "SmPC Insulin glargine Demo 100 IU/ml solution for injection §4.2 · example data — not an official list",
    );
    expect(translateInsurer("onbekend", "en")).toBe("unknown");
    expect(translateAtc("ONBEKEND", "en")).toBe("UNKNOWN");
    expect(translateRoute("nl_geregistreerd", "en")).toBe("NL-registered");
    expect(translateActor("regel-engine", "en")).toBe("rule-engine");
    expect(translatePharmacyType("zelfstandig", "en")).toBe("independent");
    expect(translatePatientCondition("ouder_van_kind", "en")).toBe("parent of a child");
    expect(translateNoticeText("SYNTHETISCHE MELDING C-001\nStof: salbutamol\nVoorgeschreven: 100 mcg inhalatiepoeder", "en")).toBe(
      "SYNTHETIC NOTICE C-001\nActive substance: salbutamol\nPrescribed: 100 mcg inhalation powder",
    );
  });

  test("client page views (HomeView, VerifyView, InstrumentView, PrintView, NotFoundView) schakelen volledig naar Engels via LanguageProvider", () => {
    const c004 = cases.find((c) => c.case_id === "C-004")!;
    const base = buildAdvice(c004);
    const validChain = base.chains.find((c) => c.status === "geldig")!;
    const approval = createApproval(validChain.chain_id, "AP-TEST", "2026-11-11T10:00:00Z");
    const approved = withApproval(base, approval);

    const html = renderToStaticMarkup(
      <LanguageProvider initialLang="en">
        <HomeView
          summaries={[{
            case_id: "C-004",
            substance: "salbutamol",
            atc: "R03AC02",
            strength: "100 mcg",
            form: "inhalatiepoeder",
            insurer: "CZ",
            flags: [],
            valid: 2,
            refused: 2,
            scenario: "sterkte / verpakking",
          }]}
          validCount={20}
          refusalCount={25}
        />
        <VerifyView initial={{ total: 0, verified: 0, brokenAt: null, rows: [] }} />
        <InstrumentView abstentions={2} />
        <PrintView gate={false} id="C-004" stored={{ chain_id: validChain.chain_id, by: "AP-TEST", at: "2026-11-11T10:00:00Z" }} advice={approved} />
        <NotFoundView />
      </LanguageProvider>,
    );

    expect(html).toContain("Substitution, with the reason included");
    expect(html).toContain("Availability is solved.");
    expect(html).toContain("The work is not.");
    expect(html).toContain("Explainable down to the source");
    expect(html).toContain("The model reads");
    expect(html).toContain("The rules decide");
    expect(html).toContain("The pharmacist approves");
    expect(html).toContain("DISPENSING ADVICE");
    expect(html).toContain("This case is not in the library.");

    for (const dutchPhrase of [
      "Substitutie, met de reden erbij",
      "Beschikbaarheid is opgelost.",
      "Het werk niet.",
      "Uitlegbaar tot op de bron",
      "Het model leest",
      "De regels beslissen",
      "De apotheker keurt goed",
      "AFLEVERADVIES",
      "Deze casus staat niet in de bibliotheek.",
    ]) {
      expect(html).not.toContain(dutchPhrase);
    }
  });
});
