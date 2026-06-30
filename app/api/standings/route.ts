import { NextResponse } from "next/server";
import { getStandings } from "@/lib/football-data";

export async function GET() {
  try {
    const standings = await getStandings();
    return NextResponse.json({ standings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
