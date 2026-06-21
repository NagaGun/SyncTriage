import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

function buildAgentPrompt(triageResult: any): string {
  const items = triageResult.action_items.map((item: any, i: number) =>
    `ID: item_${i} | Owner: ${item.owner || "unknown"} | Deadline: ${item.deadline || "none"} | Priority: ${item.priority} | Task: ${item.text}`
  ).join("\n")

  return `You are a meeting follow-up agent. For each action item below, decide what to do:
- Draft a follow-up email for P0/P1 items with a known owner
- Create a calendar block when a deadline is an explicit date
- Skip P2 items or items with no owner or TBD deadline

Action items:
${items}

ALWAYS respond with valid JSON only — no markdown, no explanation.
Output a JSON array of objects. Each object MUST have:
- "name": the exact name of the tool ("draft_followup_email", "create_calendar_block", or "skip_item")
- "args": an object with the required parameters for that tool

Tool specifications:
1. draft_followup_email: requires "to" (string), "subject" (string), "body" (string), "item_id" (string)
2. create_calendar_block: requires "title" (string), "date" (string ISO 8601), "attendee" (string), "item_id" (string)
3. skip_item: requires "item_id" (string), "reason" (string)`
}

async function stagePendingAction(meetingId: string, call: any) {
  const { error } = await supabase.from("pending_actions").insert({
    meeting_id: meetingId,
    tool_name: call.name,
    args: call.args,
    status: "pending"
  })
  if (error) throw new Error(`Failed to stage action: ${error.message}`)
}

export async function runAgent(triageResult: any, meetingId: string) {
  const invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
  const prompt = buildAgentPrompt(triageResult)

  const apiKey = process.env.NVIDIA_API_KEY || "";
  const authHeader = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;

  let raw: string
  try {
    const response = await fetch(invoke_url, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemma-3n-e2b-it",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.20,
        top_p: 0.70,
        frequency_penalty: 0.00,
        presence_penalty: 0.00,
        stream: false
      })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`HTTP ${response.status}: ${err}`)
    }

    const data = await response.json()
    raw = data.choices?.[0]?.message?.content || ""
  } catch (e: any) {
    throw new Error(`NVIDIA API call failed: ${e.message}`)
  }

  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```/g, "")
    .trim()

  let calls: any[]
  try {
    calls = JSON.parse(cleaned)
    if (!Array.isArray(calls)) {
      calls = [calls]
    }
  } catch {
    throw new Error("Model returned non-JSON output")
  }

  let stagedCount = 0
  for (const call of calls) {
    if (call.name && call.args) {
      console.log(`Staging: ${call.name}`, call.args)
      await stagePendingAction(meetingId, call)
      stagedCount++
    }
  }

  return { staged: stagedCount > 0 }
}
