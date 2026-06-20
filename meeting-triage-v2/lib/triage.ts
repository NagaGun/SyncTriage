import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@supabase/supabase-js"

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const SYSTEM = `You are a meeting triage assistant.
Extract structured data from meeting transcripts.
ALWAYS respond with valid JSON only — no markdown, no explanation.
Use exactly this shape:
{
  "action_items": [{"text":"...","owner":"...","deadline":"...","priority":"P0"|"P1"|"P2"}],
  "decisions":    [{"text":"..."}],
  "open_questions":[{"text":"..."}]
}
Priority rules:
  P0 = blocks another person or external dependency from proceeding, due today or tomorrow
  P1 = due this week, no blocking dependency
  P2 = no hard deadline or low urgency`

function applyGuardrails(data: any) {
  const required = ["action_items", "decisions", "open_questions"]
  for (const key of required) {
    if (!Array.isArray(data[key])) data[key] = []
  }

  const p0s = data.action_items.filter((i: any) => i.priority === "P0")
  if (p0s.length > 5) {
    let count = 0
    data.action_items = data.action_items.map((item: any) => {
      if (item.priority === "P0" && count++ >= 3) return { ...item, priority: "P1" }
      return item
    })
  }

  // Downgrade any item whose deadline is a day-of-week with no blocking signal
  const blockingSignals = ["blocking", "locked out", "can't proceed", "waiting on"]
  data.action_items = data.action_items.map((item: any) => {
    if (item.priority === "P0" && !blockingSignals.some(s => item.text.toLowerCase().includes(s))) {
      return { ...item, priority: "P1" }
    }
    return item
  })

  const valid = new Set(["P0", "P1", "P2"])
  data.action_items = data.action_items.map((item: any) => ({
    ...item,
    priority: valid.has(item.priority) ? item.priority : "P2"
  }))

  data.action_items = data.action_items.filter(
    (i: any) => typeof i.text === "string" && i.text.trim().length > 0
  )

  return data
}

export async function triage(transcript: string, userId?: string) {
  const model = genai.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM
  })

  let raw: string
  try {
    const result = await model.generateContent(transcript)
    raw = result.response.text()
  } catch (e: any) {
    throw new Error(`Gemini API call failed: ${e.message}`)
  }

  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```/g, "")
    .trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("Model returned non-JSON output")
  }

  const guardrailed = applyGuardrails(parsed)

  let meetingId: string | undefined

  if (userId) {
    const { data: meeting } = await supabase
      .from("meetings")
      .insert({ user_id: userId, transcript })
      .select()
      .single()

    if (meeting) {
      meetingId = meeting.id
      await supabase.from("triage_results").insert({
        meeting_id: meeting.id,
        raw_llm: parsed,
        guardrailed
      })
    }
  }

  return { guardrailed, meetingId }
}
