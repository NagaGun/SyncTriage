"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import AppShell from "../components/AppShell"

type Action = {
  id: string
  tool_name: string
  args: any
  status: string
  created_at: string
}

const TOOL_BADGES: Record<string, { label: string; className: string }> = {
  draft_followup_email: { label: "✉️ Email", className: "badge badge-email" },
  create_calendar_block: { label: "📅 Calendar", className: "badge badge-calendar" },
  skip_item: { label: "⏭ Skip", className: "badge badge-skip" },
}

export default function ApprovalsPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  useEffect(() => {
    fetchActions()
  }, [])

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
    if (!session?.user?.id) return
    setProcessingId(id)
    try {
      const res = await fetch(`/api/actions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Approval failed")
      }
      // Optimistic remove
      setActions(prev => prev.filter(a => a.id !== id))
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleSkip(id: string) {
    setProcessingId(id)
    await fetch(`/api/actions/${id}/skip`, { method: "POST" })
    setActions(prev => prev.filter(a => a.id !== id))
    setProcessingId(null)
  }

  return (
    <AppShell>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">
            {loading
              ? "Loading pending actions..."
              : `${actions.length} action${actions.length !== 1 ? "s" : ""} awaiting your review.`}
          </p>
        </div>

        {/* Empty State */}
        {!loading && actions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <h3 className="empty-state-title">All caught up!</h3>
            <p className="empty-state-text">No pending actions to review. Run a triage to generate follow-ups.</p>
          </div>
        )}

        {/* Action Cards */}
        {actions.map((action, idx) => {
          const badge = TOOL_BADGES[action.tool_name] || { label: "Action", className: "badge" }
          const isProcessing = processingId === action.id

          return (
            <div
              key={action.id}
              className="action-card animate-in"
              style={{ animationDelay: `${idx * 0.05}s`, opacity: isProcessing ? 0.5 : 1 }}
            >
              <div className="action-card-header">
                <span className={badge.className}>{badge.label}</span>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: "auto" }}>
                  {new Date(action.created_at).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              </div>

              <div className="action-card-body">
                {action.tool_name === "draft_followup_email" && (
                  <>
                    <div className="action-card-field">
                      <div className="action-card-label">To</div>
                      <div className="action-card-value">{action.args.to}</div>
                    </div>
                    <div className="action-card-field">
                      <div className="action-card-label">Subject</div>
                      <div className="action-card-value" style={{ fontWeight: 500 }}>{action.args.subject}</div>
                    </div>
                    <div className="action-card-field">
                      <div className="action-card-label">Body</div>
                      <div className="action-card-value" style={{ color: "var(--text-secondary)" }}>{action.args.body}</div>
                    </div>
                  </>
                )}

                {action.tool_name === "create_calendar_block" && (
                  <>
                    <div className="action-card-field">
                      <div className="action-card-label">Event</div>
                      <div className="action-card-value" style={{ fontWeight: 500 }}>{action.args.title}</div>
                    </div>
                    <div className="action-card-field">
                      <div className="action-card-label">Date</div>
                      <div className="action-card-value">{action.args.date}</div>
                    </div>
                    {action.args.attendee && (
                      <div className="action-card-field">
                        <div className="action-card-label">Attendee</div>
                        <div className="action-card-value">{action.args.attendee}</div>
                      </div>
                    )}
                  </>
                )}

                {action.tool_name === "skip_item" && (
                  <div className="action-card-field">
                    <div className="action-card-label">Reason</div>
                    <div className="action-card-value" style={{ color: "var(--text-secondary)" }}>{action.args.reason}</div>
                  </div>
                )}
              </div>

              <div className="action-card-actions">
                {action.tool_name !== "skip_item" && (
                  <button
                    onClick={() => handleApprove(action.id)}
                    disabled={isProcessing}
                    className="btn-primary btn-sm"
                  >
                    {isProcessing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Approve & Send"}
                  </button>
                )}
                <button
                  onClick={() => handleSkip(action.id)}
                  disabled={isProcessing}
                  className="btn-danger btn-sm"
                >
                  Skip
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
