import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, race, distance, decision } = body;
  console.log(`FEEDBACK: ${type} | ${race} | ${distance} | ${decision}`);
  return NextResponse.json({ success: true });
}
