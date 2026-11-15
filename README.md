# Hangout

Website and clickable demo for Hangout: turn "we should hang out" into a plan.

## The flow

1. `/start`: create a meeting (purpose, date range, number of people, optional name).
2. `/start/people`: confirms the crew size.
3. `/room`: waiting room with an invite link. **Try with a demo crew** fills the seats.
4. `/room/join` (host) and `/join` (invite link): tap-to-fill availability grid with
   **Connect calendar (demo)**, then a 6-question personality quiz (with a private budget).
5. Everyday plans (free): ideas → vote → locked plan with calendar → the day → recap.
6. Big plans (2+ nights or 6+ people): Big Plan unlock ($4.99) or Crew Pass → ideas with
   private budget match → vote → who's really in → cost split with settle-up status → the day → recap.

## Business model

- **Everyday**: $0. **Big Plan unlock**: $4.99 once per plan, added to the split.
- **Crew Pass**: $39.99/year or $5.99/month. Partners pay commission; Hangout never holds money.

All prices, rules, demo crew, ideas, quiz and the mock calendar live in `src/lib/config.ts`.
Money is integer cents.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Import the GitHub repo in Vercel with the default Next.js settings. No environment variables:
payments are mock only. Demo card: 4242 4242 4242 4242, any future date, any CVC, any ZIP.

Demo state is saved in the browser only. The header switch toggles the Crew Pass; Settings has
"Reset demo".
