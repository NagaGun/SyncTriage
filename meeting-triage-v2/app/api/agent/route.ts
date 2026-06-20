import { NextRequest, NextResponse } from "next/server"
import { runAgent } from "@/lib/agent"

export async function POST(req: NextRequest) {
  const { triageResult, meetingId } = await req.json()

  if (!triageResult || !meetingId) {
    return NextResponse.json({ error: "triageResult and meetingId are required" }, { status: 400 })
  }

  try {
    const result = await runAgent(triageResult, meetingId)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
