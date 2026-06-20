import { google } from "googleapis"

function getOAuthClient(accessToken: string, refreshToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  return oauth2
}

export async function sendEmail(
  accessToken: string,
  refreshToken: string,
  to: string,
  subject: string,
  body: string
) {
  const auth = getOAuthClient(accessToken, refreshToken)
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
  accessToken: string,
  refreshToken: string,
  title: string,
  date: string,
  attendeeEmail?: string
) {
  const auth = getOAuthClient(accessToken, refreshToken)
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
