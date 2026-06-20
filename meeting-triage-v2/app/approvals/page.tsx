"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Action = {
  id: string
  tool_name: string
  args: any
  status: string
  created_at: string
}

const TOOL_LABELS: Record<string, string> = {
  draft_followup_email: "Email",
  create_calendar_block: "Calendar block",
  skip_item: "Skip"
}

export default function ApprovalsPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter();
  const [meetingId, setMeetingId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('meetingId') || '';
      setMeetingId(id);
    }
  }, []);

  useEffect(() => {
    if (meetingId) fetchActions()
  }, [meetingId])

  async function fetchActions() {
    const { data } = await supabase
      .from("pending_actions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
    setActions(data || [])
    setLoading(false)
  }

  async function handleApprove(id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    let refreshToken = session?.provider_refresh_token
    if (!refreshToken && session?.user?.id) {
      const { data: tokenRecord } = await supabase
        .from("user_tokens")
        .select("refresh_token")
        .eq("user_id", session.user.id)
        .single()
      if (tokenRecord) refreshToken = tokenRecord.refresh_token
    }

    await fetch(`/api/actions/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: session?.provider_token || "",
        refreshToken: refreshToken || ""
      })
    })
    setActions(prev => prev.filter(a => a.id !== id))
  }

  async function handleSkip(id: string) {
    await fetch(`/api/actions/${id}/skip`, { method: "POST" })
    setActions(prev => prev.filter(a => a.id !== id))
  }

  if (loading) return <p style={{ padding: "2rem", fontSize: 14, color: "var(--color-text-secondary)" }}>Loading...</p>

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>Approval queue</h1>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>
        {actions.length} action{actions.length !== 1 ? "s" : ""} pending
      </p>

      {actions.length === 0 && (
        <p style={{ fontSize: 14, color: "#888" }}>All caught up — no pending actions.</p>
      )}

      {actions.map(action => (
        <div key={action.id} style={{
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 12, padding: "14px 16px",
          marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start"
        }}>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 6,
            background: action.tool_name === "draft_followup_email" ? "#EEEDFE" : "#E1F5EE",
            color: action.tool_name === "draft_followup_email" ? "#3C3489" : "#0F6E56",
            flexShrink: 0, marginTop: 1
          }}>
            {TOOL_LABELS[action.tool_name]}
          </span>

          <div style={{ flex: 1 }}>
            {action.tool_name === "draft_followup_email" && (
              <>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>
                  To: {action.args.to}
                </div>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
                  {action.args.subject}
                </div>
                <div style={{ fontSize: 13, color: "#555" }}>{action.args.body}</div>
              </>
            )}
            {action.tool_name === "create_calendar_block" && (
              <>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>
                  {action.args.title}
                </div>
                <div style={{ fontSize: 13, color: "#888" }}>
                  {action.args.date}{action.args.attendee ? ` · ${action.args.attendee}` : ""}
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => handleApprove(action.id)} style={{
              fontSize: 13, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
              border: "0.5px solid var(--color-border-success)",
              background: "var(--color-background-success)", color: "var(--color-text-success)"
            }}>Approve</button>
            <button onClick={() => handleSkip(action.id)} style={{
              fontSize: 13, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-primary)", color: "var(--color-text-secondary)"
            }}>Skip</button>
          </div>
        </div>
      ))}
    </main>
  )
}
