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
        stagedCount = agentResult.staged ? 1 : 0
        // Get actual count from DB
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        )
        const { count } = await supabase
          .from("pending_actions")
          .select("*", { count: "exact", head: true })
          .eq("meeting_id", meetingId)
          .eq("status", "pending")
        stagedCount = count || 0
      } catch (agentErr: any) {
        console.error("Agent error (non-fatal):", agentErr.message)
      }
    }

    return NextResponse.json({ ...guardrailed, meetingId, stagedCount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
