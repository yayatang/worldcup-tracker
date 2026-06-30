import { NextResponse } from "next/server";
import { getMatches } from "@/lib/football-data";

export async function GET() {
  try {
    const matches = await getMatches();
    return NextResponse.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
