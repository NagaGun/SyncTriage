import { NextRequest, NextResponse } from "next/server"
import { triage } from "@/lib/triage"
import { runAgent } from "@/lib/agent"

export async function POST(req: NextRequest) {
  const { transcript, userId } = await req.json()

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
  }

  try {
    const { guardrailed, meetingId } = await triage(transcript, userId)

    let stagedCount = 0
    if (meetingId) {
      try {
        const agentResult = await runAgent(guardrailed, meetingId)
        stagedCount = agentResult.stagedCount
      } catch (agentErr: any) {
        console.error("Agent error (non-fatal):", agentErr.message)
      }
    }

    return NextResponse.json({ ...guardrailed, meetingId, stagedCount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
