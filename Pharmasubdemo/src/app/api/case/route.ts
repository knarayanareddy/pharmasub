import { NextResponse } from "next/server";
import { cases } from "@/domain/data";

export function GET() { return NextResponse.json({ cases }); }
