"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import AppShell from "../components/AppShell"

type ActionItem = { text: string; owner?: string; deadline?: string; priority: "P0" | "P1" | "P2" }
type Decision = { text: string }
type TriageResult = {
  action_items: ActionItem[]
  decisions: Decision[]
  open_questions: Decision[]
  meetingId?: string
  stagedCount?: number
}

export default function DashboardPage() {
  const [transcript, setTranscript] = useState("")
  const [result, setResult] = useState<TriageResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [stats, setStats] = useState({ meetings: 0, pending: 0, sent: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  useEffect(() => {
    if (!session) return
    async function fetchStats() {
      const [meetingsRes, pendingRes, sentRes] = await Promise.all([
        supabase.from("meetings").select("*", { count: "exact", head: true }),
        supabase.from("pending_actions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("pending_actions").select("*", { count: "exact", head: true }).eq("status", "sent"),
      ])
      setStats({
        meetings: meetingsRes.count || 0,
        pending: pendingRes.count || 0,
        sent: sentRes.count || 0,
      })
    }
    fetchStats()
  }, [session, result])

  async function handleTriage() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, userId: session?.user?.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Paste a meeting transcript to extract action items, decisions, and follow-ups.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Meetings Triaged</div>
            <div className="stat-value">{stats.meetings}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Actions Sent</div>
            <div className="stat-value">{stats.sent}</div>
          </div>
        </div>

        {/* Triage Form */}
        <div className="card" style={{ marginBottom: 24 }}>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder="Paste your meeting transcript here..."
            id="transcript-input"
          />
          <div style={{ marginTop: 14 }}>
            <button
              onClick={handleTriage}
              disabled={loading || !transcript.trim()}
              className="btn-primary btn-full"
              id="run-triage-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Analyzing Transcript...
                </>
              ) : (
                "Run Triage"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "12px 16px",
            background: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--danger-text)",
            fontSize: 14,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {/* Agent Banner */}
        {result && result.stagedCount !== undefined && result.stagedCount > 0 && (
          <div className="agent-banner animate-in">
            <span className="agent-banner-icon">🤖</span>
            <span className="agent-banner-text">
              Agent staged <strong>{result.stagedCount}</strong> follow-up action{result.stagedCount !== 1 ? "s" : ""}.
            </span>
            <Link href={`/approvals${result.meetingId ? `?meetingId=${result.meetingId}` : ""}`} className="agent-banner-link">
              Review →
            </Link>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="results-container animate-in">
            {/* Action Items */}
            <div className="result-section">
              <h2 className="section-title">Action Items ({result.action_items.length})</h2>
              {result.action_items.map((item, i) => (
                <div key={i} className="item-card">
                  <span className={`priority-badge ${item.priority.toLowerCase()}-badge`}>
                    {item.priority}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="item-text">{item.text}</div>
                    {(item.owner || item.deadline) && (
                      <div className="item-meta">
                        {item.owner && <span>Owner: {item.owner}</span>}
                        {item.owner && item.deadline && <span> · </span>}
                        {item.deadline && <span>Due: {item.deadline}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Decisions */}
            {result.decisions.length > 0 && (
              <div className="result-section">
                <h2 className="section-title">Decisions ({result.decisions.length})</h2>
                {result.decisions.map((d, i) => (
                  <div key={i} className="decision-card">{d.text}</div>
                ))}
              </div>
            )}

            {/* Open Questions */}
            {result.open_questions.length > 0 && (
              <div className="result-section">
                <h2 className="section-title">Open Questions ({result.open_questions.length})</h2>
                {result.open_questions.map((q, i) => (
                  <div key={i} className="question-card">{q.text}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
