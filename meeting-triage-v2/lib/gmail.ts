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
    "Content-Type: text/plain; charset=utf-8",
    "",
    body
  ].join("\n")

  const encoded = Buffer.from(message).toString("base64url")

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded }
  })
}

export async function createCalendarEvent(
  userId: string,
  title: string,
  date: string,
  attendeeEmail?: string
) {
  const auth = await getAuthClientForUser(userId)
  const calendar = google.calendar({ version: "v3", auth })

  await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      start: { date },
      end:   { date },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : []
    }
  })
}
