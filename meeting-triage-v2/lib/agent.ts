import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@supabase/supabase-js"
import { TOOL_DEFINITIONS } from "./tools"

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
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

Call the appropriate tool for each item. Use the exact item ID provided.`
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
  const model = genai.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [{ functionDeclarations: TOOL_DEFINITIONS } as any]
  })

  const chat = model.startChat()
  const prompt = buildAgentPrompt(triageResult)

  let response = await chat.sendMessage(prompt)
  let iterations = 0
  const MAX_ITERATIONS = 10

  while (response.functionCalls()?.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++
    const calls = response.functionCalls()!

    for (const call of calls) {
      console.log(`Staging: ${call.name}`, call.args)
      await stagePendingAction(meetingId, call)
    }

    response = await chat.sendMessage(
      calls.map(c => ({
        functionResponse: {
          name: c.name,
          response: { staged: true }
        }
      }))
    )
  }

  return { staged: iterations > 0 }
}
