"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import AppShell from "../components/AppShell"

type Meeting = {
  id: string
  title: string | null
  created_at: string
  triage_results: { guardrailed: any }[]
  pending_actions: { tool_name: string; status: string }[]
}

export default function HistoryPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMeetings() {
      setLoading(true)
      const { data } = await supabase
        .from("meetings")
        .select(`
          id, title, created_at,
          triage_results (guardrailed),
          pending_actions (tool_name, status)
        `)
        .order("created_at", { ascending: false })
        .limit(20)
      setMeetings((data as any) || [])
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchMeetings()
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchMeetings()
      } else {
        setMeetings([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AppShell>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">Past meeting triages and their results.</p>
        </div>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        )}

        {!loading && meetings.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3 className="empty-state-title">No meetings yet</h3>
            <p className="empty-state-text">Run your first triage from the Dashboard to see history here.</p>
          </div>
        )}

        {meetings.map((meeting, idx) => {
          const actions = meeting.pending_actions || []
          const sent = actions.filter(a => a.status === "sent").length
          const pending = actions.filter(a => a.status === "pending").length
          const result = meeting.triage_results?.[0]?.guardrailed
          const itemCount = result?.action_items?.length ?? 0
          const isExpanded = expandedId === meeting.id

          return (
            <div key={meeting.id} className="animate-in" style={{ animationDelay: `${idx * 0.04}s` }}>
              <div
                className="meeting-row"
                onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                style={isExpanded ? { borderRadius: "var(--radius-md) var(--radius-md) 0 0", borderBottomColor: "transparent" } : {}}
              >
                <div className="meeting-row-left">
                  <div className="meeting-row-title">{meeting.title || "Untitled meeting"}</div>
                  <div className="meeting-row-meta">
                    {new Date(meeting.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                    {" · "}{itemCount} action item{itemCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="meeting-row-badges">
                  {sent > 0 && <span className="badge badge-sent">{sent} sent</span>}
                  {pending > 0 && <span className="badge badge-pending">{pending} pending</span>}
                  <span style={{ fontSize: 14, color: "var(--text-tertiary)", marginLeft: 4 }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && result && (
                <div className="meeting-detail animate-in">
                  {result.action_items?.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <h3 className="section-title">Action Items</h3>
                      {result.action_items.map((item: any, i: number) => (
                        <div key={i} className="item-card" style={{ marginBottom: 8 }}>
                          <span className={`priority-badge ${item.priority?.toLowerCase()}-badge`}>
                            {item.priority}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div className="item-text">{item.text}</div>
                            {(item.owner || item.deadline) && (
                              <div className="item-meta">
                                {item.owner && <span>Owner: {item.owner}</span>}
                                {item.owner && item.deadline && " · "}
                                {item.deadline && <span>Due: {item.deadline}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.decisions?.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <h3 className="section-title">Decisions</h3>
                      {result.decisions.map((d: any, i: number) => (
                        <div key={i} className="decision-card" style={{ marginBottom: 6 }}>{d.text}</div>
                      ))}
                    </div>
                  )}

                  {result.open_questions?.length > 0 && (
                    <div>
                      <h3 className="section-title">Open Questions</h3>
                      {result.open_questions.map((q: any, i: number) => (
                        <div key={i} className="question-card" style={{ marginBottom: 6 }}>{q.text}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
