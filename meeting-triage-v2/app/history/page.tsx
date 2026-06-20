import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export default async function HistoryPage() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookies().getAll() } } }
  )

  const { data: meetings } = await supabase
    .from("meetings")
    .select(`
      id, title, created_at,
      triage_results (guardrailed),
      pending_actions (tool_name, status)
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Meeting history</h1>

      {!meetings?.length && (
        <p style={{ fontSize: 14, color: "#888" }}>No meetings yet.</p>
      )}

      {meetings?.map(meeting => {
        const actions = (meeting.pending_actions as any[]) || []
        const sent    = actions.filter(a => a.status === "sent").length
        const pending = actions.filter(a => a.status === "pending").length
        const result  = (meeting.triage_results as any[])?.[0]?.guardrailed
        const itemCount = result?.action_items?.length ?? 0

        return (
          <div key={meeting.id} style={{
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: 12, padding: "14px 16px", marginBottom: 10
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                  {meeting.title || "Untitled meeting"}
                </div>
                <div style={{ fontSize: 13, color: "#888" }}>
                  {new Date(meeting.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                  })}
                  {" · "}{itemCount} action item{itemCount !== 1 ? "s" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {sent > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: "#E1F5EE", color: "#0F6E56" }}>
                    {sent} sent
                  </span>
                )}
                {pending > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: "#FAEEDA", color: "#633806" }}>
                    {pending} pending
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </main>
  )
}
