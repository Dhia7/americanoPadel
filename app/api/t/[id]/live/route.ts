import { NextResponse } from "next/server";
import { fetchTournamentLiveVersion } from "@/lib/tournament-version";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const version = await fetchTournamentLiveVersion(id);

  if (!version) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { version },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
