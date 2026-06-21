"use client"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    // Fetch pending actions count
    async function fetchCount() {
      const { count } = await supabase
        .from("pending_actions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
      setPendingCount(count || 0)
    }
    fetchCount()
    const interval = setInterval(fetchCount, 15000)
    return () => clearInterval(interval)
  }, [session])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (!session) return null

  const user = session.user
  const initial = (user.email?.[0] || "U").toUpperCase()

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/approvals", label: "Approvals", icon: "✅", badge: pendingCount > 0 ? pendingCount : null },
    { href: "/history", label: "History", icon: "📁" },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          Sync<span>Triage</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`sidebar-link ${pathname === link.href ? "active" : ""}`}
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            {link.label}
            {link.badge && <span className="sidebar-badge">{link.badge}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.user_metadata?.full_name || "User"}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
        </div>
        <button onClick={handleSignOut} className="sidebar-signout">
          Sign out
        </button>
      </div>
    </aside>
  )
}
