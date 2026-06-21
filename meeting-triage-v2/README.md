# Meeting Triage V2

A Next.js application that takes a meeting transcript, extracts action items, decisions, and open questions, then automatically drafts follow‑up emails, creates calendar events, or skips items based on priority.

## Features
- Real‑time transcription upload UI
- Google Gemini‑powered triage of meeting notes
- Automated agent that stages actions in Supabase
- Email drafting via Gmail API
- Calendar event creation via Google Calendar API
- Approval queue for pending actions
- History view of past meetings

## Getting Started
1. **Prerequisites**
   - Node.js (>=18) – installed at `C:\Program Files\nodejs`
   - npm (bundled with Node) – `C:\Program Files\nodejs\npm.cmd`
   - Supabase project with the schema in `supabase/schema.sql`
   - Google Cloud credentials (client ID/secret) for Gmail & Calendar APIs
2. **Install dependencies**
   ```powershell
   $env:PATH = "C:\Program Files\nodejs;$env:APPDATA\npm;$env:PATH"
   "C:\Program Files\nodejs\npm.cmd" install
   ```
3. **Configure environment**
   - Copy `.env.example` to `.env.local`
   - Fill in `GEMINI_API_KEY`, Supabase URLs/keys, Google OAuth values, and `CRON_SECRET`.
4. **Run the development server**
   ```powershell
   $env:PATH = "C:\Program Files\nodejs;$env:APPDATA\npm;$env:PATH"
   "C:\Program Files\nodejs\npm.cmd" run dev
   ```
   The app will be available at `http://localhost:3000`.

## API Endpoints
- `POST /api/triage` – Send a transcript, receive structured JSON.
- `POST /api/agent` – Runs the autonomous agent to stage actions.
- `GET /api/cron/recheck` – Cron job that re‑checks overdue pending actions.
- `GET /api/actions/pending` – List pending actions for a meeting.
- `POST /api/actions/{id}/approve` – Approve a pending action (sends email/event).
- `POST /api/actions/{id}/skip` – Skip an action.

## Development
- Run `npm run lint` to lint the code.
- Run `npm run build` for a production build.
- Deploy to Vercel – the `vercel.json` defines the `/api/cron/recheck` schedule.

## License
MIT © 2026 NagaGun
