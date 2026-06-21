"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Sidebar from "./Sidebar"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) router.push("/")
    })
    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (!session) {
    router.push("/")
    return null
  }

  return (
    <>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </>
  )
}
