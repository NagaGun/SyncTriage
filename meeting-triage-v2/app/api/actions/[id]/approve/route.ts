import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail, createCalendarEvent } from "@/lib/gmail"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { editedArgs, userId } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const { data: action, error } = await supabase
    .from("pending_actions")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !action) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 })
  }

  const args = editedArgs || action.args

  try {
    if (action.tool_name === "draft_followup_email") {
      await sendEmail(userId, args.to, args.subject, args.body)
    } else if (action.tool_name === "create_calendar_block") {
      await createCalendarEvent(userId, args.title, args.date, args.attendee)
    }

    await supabase
      .from("pending_actions")
      .update({ status: "sent", sent_at: new Date().toISOString(), edited_args: editedArgs || null })
      .eq("id", id)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
