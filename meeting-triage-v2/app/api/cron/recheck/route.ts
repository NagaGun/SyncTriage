import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const { data: overdue } = await supabase
    .from("pending_actions")
    .select("*")
    .eq("status", "sent")
    .eq("tool_name", "draft_followup_email")
    .lt("sent_at", cutoff.toISOString())
    .eq("reply_received", false)

  if (!overdue?.length) return NextResponse.json({ repinged: 0 })

  for (const action of overdue) {
    await supabase.from("pending_actions").insert({
      meeting_id: action.meeting_id,
      tool_name: "draft_followup_email",
      args: {
        ...action.args,
        subject: `[Follow-up] ${action.args.subject}`,
        body: "Just following up — any update on this?",
        is_reping: true
      },
      status: "pending"
    })
  }

  return NextResponse.json({ repinged: overdue.length })
}
