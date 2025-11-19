import { NextRequest, NextResponse } from "next/server";
import { getTopScores, saveScores } from "@/lib/leaderboard";

export async function GET() {
  const scores = await getTopScores(20);
  return NextResponse.json({ scores });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.players)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entries = body.players
    .slice(0, 10)
    .map((p: any) => ({
      name: typeof p?.name === "string" && p.name.trim() ? p.name.trim().slice(0, 50) : "Player",
      score: Number(p?.score) || 0,
    }))
    .filter((p: { score: number }) => p.score >= 0);

  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid scores" }, { status: 400 });
  }

  const scores = await saveScores(entries, 20);
  return NextResponse.json({ scores });
}
