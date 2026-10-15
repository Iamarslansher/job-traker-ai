# JobTrack AI

An AI-assisted job search workspace built with Next.js, Firebase, and Gemini. The application board works in demo mode without any credentials and saves demo changes in the current browser.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional integrations

Add Firebase web app configuration to `.env.local` to enable Google and email/password sign-in plus per-user Firestore job storage. Enable those sign-in providers in Firebase Authentication and publish the included `firestore.rules` to your Firebase project.

Set `GEMINI_API_KEY` to enable job-description parsing and tailored cover-letter/follow-up drafts. The key is used only by server actions and is never sent to the browser.

See `.env.example` for the supported environment variable names. Without Firebase, the dashboard remains available in demo mode; without Gemini, AI actions show a setup message and manual job entry still works.
