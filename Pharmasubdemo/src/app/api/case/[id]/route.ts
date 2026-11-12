import { NextResponse } from "next/server";
import { getCase } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";

export function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const c = getCase(id);
    return c ? NextResponse.json({ case: c, advice: buildAdvice(c) }) : NextResponse.json({ error: "E-CASE-01" }, { status: 404 });
  });
}
