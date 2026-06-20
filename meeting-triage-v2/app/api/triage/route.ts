import { NextRequest, NextResponse } from "next/server"
import { triage } from "@/lib/triage"
import { runAgent } from "@/lib/agent"

export async function POST(req: NextRequest) {
  const { transcript, userId } = await req.json()

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
  }

  try {
    const { guardrailed, meetingId: createdMeetingId } = await triage(transcript, userId)

    // Don't await — let agent run in background
    if (createdMeetingId) runAgent(guardrailed, createdMeetingId).catch(console.error)

    return NextResponse.json(guardrailed)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
