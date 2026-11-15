# Hangout

Website and clickable demo for Hangout: turn "we should hang out" into a booked plan.

- `/` is the landing page: hero, how it works, pricing.
- `/demo` is the 10-step demo of a Big Plan (a weekend away for 6), with no sign-up.

## Business model (from "Hangout business model and proof of willingness to pay")

- **Everyday**: $0. Dates, budget and vibe matching, three options, a vote, calendar, recap.
- **Big Plan unlock**: $4.99 once per plan, paid by the organizer and added to the cost split.
  A plan is big if it's more than one day, 6+ people, or over $75 a person.
- **Crew Pass**: $39.99 a year or $5.99 a month. Unlimited big plans, next hangout proposed
  automatically, full group history.
- **Partner commission**: partners pay Hangout; users never do. Hangout never holds money.

All prices, rules and demo data live in `src/lib/config.ts`. Money is integer cents.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

Import the GitHub repo in Vercel and deploy with the default Next.js settings.
No environment variables are needed: payments in the demo are mock only, nothing is charged.

## Demo notes

- Demo state is saved in the browser (localStorage) only.
- The header switch toggles "Has pass / No pass" instantly. Settings has "Reset demo".
- Demo card for checkout: 4242 4242 4242 4242, any future date, any CVC, any ZIP.
