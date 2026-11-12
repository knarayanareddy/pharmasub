import type { CaseSummary } from "@/components/CaseExplorer";
import { HomeView } from "@/components/HomeView";
import { cases } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";
import "./home.css";

export default function HomePage() {
  const summaries: CaseSummary[] = cases.map((c) => {
    const advice = buildAdvice(c);
    const n = Number(c.case_id.slice(2));
    return {
      case_id: c.case_id,
      substance: c.substance,
      atc: c.atc,
      strength: c.strength,
      form: c.form,
      insurer: c.insurer,
      flags: c.patient_flags,
      valid: advice.chains.filter((chain) => chain.status === "geldig").length,
      refused: advice.refusals.length,
      scenario: [17, 22, 23, 24, 25, 26, 27, 28, 29, 30].includes(n)
        ? "geen veilige keten"
        : [4, 12, 13, 14, 15, 16, 18, 19, 20, 21].includes(n)
          ? "sterkte / verpakking"
          : "gelijke sterkte",
    };
  });
  const validCount = summaries.filter((item) => item.valid > 0).length;
  const refusalCount = summaries.reduce((sum, item) => sum + item.refused, 0);
  return <HomeView summaries={summaries} validCount={validCount} refusalCount={refusalCount} />;
}
