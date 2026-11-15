# Hangout

Website and clickable demo for Hangout: turn "we should hang out" into a plan.

## The flow

1. `/start`: create a meeting (purpose, vibe, dates, people). The AI writes this group's
   personality quiz once, in the background; a pre-written demo quiz is ready instantly.
2. `/room`: waiting room with an invite link. **Try with a demo crew** fills the seats.
3. `/room/join` (host) and `/join` (invite link): availability grid, then first name, location on a
   map (tap, drag, search or "Use my location", plus travel time), budget, deal-breakers and the
   group's 5 personality questions. The host's pin sets the group's city; the demo crew moves with it.
4. `/room/ideas`: 3 plans (5 with Crew Pass) written live by AI from what the group entered.
   Sample plans if the AI is off, slow (8 s) or wrong. Then vote, settle up, the plan, the day, recap.

## Business model

- **Free for everyone:** planning, voting, booking links and settle-up. No booking fee anywhere.
  Max 50 people per hangout.
- **Big Plan unlock:** $4.99 once per big plan (trips, or 10+ people expected or joined) for users without Crew Pass.
  Setup stays open; big plans unlock right before the ideas and voting.
- **Crew Pass:** $39.99/year (Stripe test checkout). 5 vote options instead of 3, unlimited big plans,
  cost split with who-owes-whom and Venmo buttons, private "My spending" chart, full history.
- **Partner venues:** 10% off the share (partners are demo data until confirmed).
- **Settle up:** the host adds a Venmo username; friends get a "Pay @handle on Venmo" link and "I paid".
  Hangout never holds money.

All prices, rules, AI settings, partners, sample plans, quizzes and the demo crew live in
`src/lib/config.ts`. Money is integer cents.

## Accounts and invites (browser-only demo)

- **Invite links** carry the group (purpose, dates, size, city, vibe, host's first name, AI quiz) in
  `?g=`, so they open on a friend's phone with no server. In the demo, a friend's answers stay on their device.
- **Free users** get a remembered profile on their device after their first join ("Welcome back, Dana",
  one-tap "Join as Dana", "Not you?"). Edit or "Forget me" in Settings.
- **Crew Pass** needs an account: sign-up (or demo-only "Continue with Google"), then Stripe test checkout.
  Accounts live in localStorage; passwords are stored only as a salted SHA-256 hash (crypto.subtle).
  Logged-out Pass users fall back to free features. A demo switch for judges is in Settings.

## Backend (optional, Supabase free plan)

Without Supabase keys the app runs browser-only. With them you get real accounts on every device,
shared rooms (friends' answers, votes, "I paid" and expenses reach everyone live) and short invite
links (`/join?r=CODE`).

1. Create a free project at supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run (tables, Row Level Security, live updates).
3. Authentication → Sign In / Providers: turn on **Anonymous sign-ins** (friends join without an
   account). For a demo, turn off "Confirm email" so sign-ups log in right away.
4. Add to `.env.local` and Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   and the server-only `SUPABASE_SERVICE_ROLE_KEY` (saves Stripe-verified Crew Pass and unlocks).
5. Optional real Google sign-in: enable Google in Supabase Auth, then set `NEXT_PUBLIC_GOOGLE_AUTH=true`.

## AI

- Provider is a switch in `src/lib/config.ts` (`AI.provider`: `groq`, `gemini` or `anthropic`).
  Default: Groq's free tier through its OpenAI-compatible API.
- Keys are server-only env vars, never sent to the browser: `GROQ_API_KEY`, `GEMINI_API_KEY`,
  `ANTHROPIC_API_KEY`. Without a key the app uses sample plans and the fixed quiz.
- Routes: `POST /api/suggest` (plans) and `POST /api/quiz` (quiz). System prompts are in `prompts/`.
  Replies are validated with zod; bad plans are dropped and filled from samples. 8-second timeout,
  no retries on 429, max 10 AI calls per IP per 10 minutes, cache in server memory and the browser.
- Optional `TICKETMASTER_API_KEY`: real events on the chosen night are offered to the AI.

## Run locally

```bash
npm install
cp .env.example .env.local   # all keys optional
npm run dev
```

## Deploy to Vercel

Import the GitHub repo in Vercel with the default Next.js settings and add the env vars you use
(see `.env.example`). Stripe runs in test mode only; test card 4242 4242 4242 4242.

Demo state is saved in the browser only. The header switch toggles the Crew Pass; Settings has
"Reset demo".
