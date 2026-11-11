import { surveyCsv } from "@/domain/swarm/instrument";
import { buildPersonas } from "@/domain/swarm/personas";

export function GET(request: Request) {
  const version = new URL(request.url).searchParams.get("version") === "v1" ? "v1" : "v2";
  return new Response(surveyCsv(buildPersonas(), version), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="samenstelling-synthetisch-${version}.csv"` } });
}
