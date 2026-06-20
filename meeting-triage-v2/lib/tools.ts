export const TOOL_DEFINITIONS = [
  {
    name: "draft_followup_email",
    description: "Draft a follow-up email to an action item owner. Use for P0 and P1 items that have a named owner.",
    parameters: {
      type: "object",
      properties: {
        to:      { type: "string", description: "Owner's email address" },
        subject: { type: "string", description: "Email subject line" },
        body:    { type: "string", description: "Email body — concise, 2-3 sentences max" },
        item_id: { type: "string", description: "The action item ID this email is for" }
      },
      required: ["to", "subject", "body", "item_id"]
    }
  },
  {
    name: "create_calendar_block",
    description: "Create a Google Calendar event for a deadline. Use when a deadline date is explicit (not 'sometime' or 'TBD').",
    parameters: {
      type: "object",
      properties: {
        title:    { type: "string", description: "Event title" },
        date:     { type: "string", description: "ISO 8601 date string" },
        attendee: { type: "string", description: "Owner email to invite" },
        item_id:  { type: "string", description: "The action item ID" }
      },
      required: ["title", "date", "item_id"]
    }
  },
  {
    name: "skip_item",
    description: "Mark an item as skipped — no action needed. Use for P2 items, items without owners, or TBD deadlines.",
    parameters: {
      type: "object",
      properties: {
        item_id: { type: "string" },
        reason:  { type: "string", description: "Why this was skipped" }
      },
      required: ["item_id", "reason"]
    }
  }
]
