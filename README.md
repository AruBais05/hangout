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
- **Big Plan unlock:** $4.99 once per big plan (trips, or 6+ people) for users without Crew Pass.
  Big plans pay first, before any planning.
- **Crew Pass:** $39.99/year (Stripe test checkout). 5 vote options instead of 3, unlimited big plans,
  cost split with who-owes-whom and Venmo buttons, private "My spending" chart, full history.
- **Partner venues:** 10% off the share (partners are demo data until confirmed).
- **Settle up:** the host adds a Venmo username; friends get a "Pay @handle on Venmo" link and "I paid".
  Hangout never holds money.

All prices, rules, AI settings, partners, sample plans, quizzes and the demo crew live in
`src/lib/config.ts`. Money is integer cents.

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
