import { NextResponse } from "next/server";
import { checkCompetitionStorage } from "../../../lib/app-database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const storage = await checkCompetitionStorage();
    return NextResponse.json({ ok: true, storage: storage.mode });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
