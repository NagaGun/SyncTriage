# SyncTriage ⚡

SyncTriage is an intelligent, high-contrast, emerald-and-white themed Next.js application designed to eliminate meeting fatigue. It processes meeting transcripts, calls Google Gemini/NVIDIA API to extract action items, decisions, and open questions, and then stages actions (follow-up emails and Google Calendar events) in a Supabase queue for user approval.

---

## 🚀 Key Features

*   **AI Transcript Triage:** Extracts action items with owners, deadlines, and P0/P1/P2 priorities.
*   **One-Click Approvals:** An elegant queue to review, edit inline, and approve emails or calendar events.
*   **Google Integrations:** Drafts and sends emails directly using the Gmail API, and schedules events via the Google Calendar API.
*   **Meeting History:** An expandable chronological history tracking past triaged meetings and their respective action items.
*   **Polished UX:** Premium CSS layout with clean responsive views, inline editable actions, and extension-safe hydration warning handling.

---

## 🛠️ Step-by-Step Google Calendar Guide

### How to Add Events to Google Calendar
1.  **Run Triage:** Paste a meeting transcript on the **Dashboard** page and click **Run Triage**.
2.  **Staged Action:** If the transcript contains a task with an explicit date/deadline (e.g., *"Tom needs to deploy Vercel by Friday"*), the AI agent will automatically stage a **Calendar** action.
3.  **Navigate to Approvals:** A banner will appear saying `Agent staged X follow-up action(s)`. Click **Review →** or navigate to **Approvals** on the sidebar.
4.  **Edit Inline:** On the approvals page, you will see a card labeled `📅 Calendar`. You can edit the **Event Title**, **Date**, or **Attendee Email** inline if needed.
5.  **Add to Calendar:** Click **Approve & Send**. The backend will instantly contact the Google Calendar API and insert the event into your primary calendar.

---

## ⚙️ Project Setup & Configuration

### 1. Enable Google APIs in Google Cloud Console
To send emails and write calendar events, you must enable the APIs for your Google Developer project (e.g., `972450948723`):
*   **Gmail API:** [Enable Link](https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=972450948723)
*   **Google Calendar API:** [Enable Link](https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=972450948723)

### 2. Configure OAuth Credentials in Google Cloud Console
Under **APIs & Services** -> **Credentials**:
*   Ensure **Authorized redirect URIs** contains:
    *   `https://epbtujxrvqmpehmnpyfi.supabase.co/auth/v1/callback`
    *   `http://localhost:3000/auth/callback`

### 3. Configure Supabase Google Auth Provider
In your **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Google**:
*   Ensure **Client ID** and **Client Secret** match your Google Cloud Console credentials exactly.

### 4. Create local environment config
Copy `.env.example` to `.env.local` and configure:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

NVIDIA_API_KEY=your-nvidia-api-key
GEMINI_API_KEY=your-gemini-api-key
CRON_SECRET=your-custom-cron-secret
```

---

## 🏃 Run Locally

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Database Schema
The database tables (`meetings`, `triage_results`, `pending_actions`, `user_tokens`) and Row Level Security (RLS) policies are detailed in `supabase/schema.sql`. Make sure to run them in the Supabase SQL Editor if setting up a new project.
