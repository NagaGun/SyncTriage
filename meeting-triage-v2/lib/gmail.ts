import { google } from "googleapis"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

/** Get an authenticated OAuth2 client from a user's stored refresh token */
export async function getAuthClientForUser(userId: string) {
  const { data: tokenRecord } = await supabase
    .from("user_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .single()

  if (!tokenRecord?.refresh_token) {
    throw new Error("No refresh token found for user. Please sign in again.")
  }

  const oauth2 = createOAuth2Client()
  oauth2.setCredentials({ refresh_token: tokenRecord.refresh_token })

  // Force a token refresh to get a fresh access_token
  const { credentials } = await oauth2.refreshAccessToken()
  oauth2.setCredentials(credentials)

  return oauth2
}

export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  body: string
) {
  const auth = await getAuthClientForUser(userId)
  const gmail = google.gmail({ version: "v1", auth })

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    body
  ].join("\r\n")

  const encoded = Buffer.from(message).toString("base64url")

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded }
  })
}

export async function createCalendarEvent(
  userId: string,
  title: string,
  dateStr: string,
  attendeeEmail?: string
) {
  const auth = await getAuthClientForUser(userId)
  const calendar = google.calendar({ version: "v3", auth })

  let start: any = {}
  let end: any = {}

  // Check if it's a valid date or datetime
  const isDateTime = dateStr.includes("T") || dateStr.includes(":")
  
  if (isDateTime) {
    let parsedDate = new Date(dateStr)
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date() // Fallback to now
    }
    const startStr = parsedDate.toISOString()
    // Default duration to 30 mins later
    const endStr = new Date(parsedDate.getTime() + 30 * 60 * 1000).toISOString()
    
    start = { dateTime: startStr }
    end = { dateTime: endStr }
  } else {
    // Expected YYYY-MM-DD
    let matched = dateStr.trim().match(/^\d{4}-\d{2}-\d{2}$/)
    let cleanDate = matched ? matched[0] : new Date().toISOString().split("T")[0]
    
    start = { date: cleanDate }
    end = { date: cleanDate }
  }

  // Only include attendee if it is a valid email
  const isEmail = attendeeEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail.trim())

  await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      start,
      end,
      attendees: isEmail ? [{ email: attendeeEmail!.trim() }] : []
    }
  })
}
