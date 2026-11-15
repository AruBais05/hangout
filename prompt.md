\<context\>  
We are building "Hangout", a mobile-first web app that helps friend groups  
turn "we should hang out" into a booked plan. A 10-step clickable prototype  
already exists in this repo: 1 landing, 2 quiz, 3 calendar connect, 4 group,  
5 preferences, 6 voting, 7 pay my share, 8 booked, 9 live check-in, 10 recap.  
This is for a 24-hour product competition, so it must look finished and work  
in a live demo. Jurors will open a public link on their phones and must get  
through without signing up.

Everything runs on mock data, with one exception: buying Hangout Pass uses  
Stripe in TEST MODE (test keys only, never live keys). The share payment on  
step 7 stays simulated. No real accounts, no real charges, no Google sign-in.  
\</context\>

\<first\_step\>  
Before writing code, read the existing project. Reuse its framework, folder  
structure, components, colors, fonts and spacing. Then give me a short plan  
(files to add or change, plus what I must set up in Stripe and Vercel) and  
wait for my OK.  
\</first\_step\>

\<business\_rules\>  
Put all prices, limits and demo data in one config file so we can change  
them fast. Do all money math in integer cents.

1\. Free for everyone: unlimited groups, planning, voting and check-ins.  
   Hangouts that need no booking cost nothing.  
2\. Booking fee: \$2.00 per person on each booked hangout.  
3\. Partner discount: 10% off the share at partner venues. The demo venue on  
   the winning option is a partner venue.  
4\. Hangout Pass: \$4.99 a month or \$39.99 a year, bought by one person.  
   \- The holder pays no booking fee on up to 4 booked hangouts a month, in  
     any group. From the 5th booking that month, the \$2.00 fee applies again.  
   \- Group extras unlock for a whole group when at least one member has the  
     pass: auto-plan, trip mode, surprise mode, 5 vote options (instead of 3),  
     full recap and recap history.  
   \- Members without the pass still pay their own \$2.00 fee.  
\</business\_rules\>

\<juror\_path\>  
A juror must finish this in about three minutes, with no account:  
1\. Open the link and tap "Try with a demo crew". Four sample members have  
   already answered the quiz and availability.  
2\. Enter your own dates, budget and vibe (active vs. chill). Availability is  
   a tap-to-fill grid of days and time slots. Remove Google Calendar connect  
   from step 3 and use this grid instead.  
3\. See three ranked options, each with a short reason ("fits everyone's  
   Saturday", "under your budget", "partner venue: 10% off").  
4\. Vote, then tap "End voting" (the timer may also run out).  
5\. Pay my share (step 7): simulated payment showing the fee math below.  
6\. See the locked plan with "Add to calendar": a Google Calendar add-event  
   link (no sign-in) and a downloadable .ics file.  
7\. Tap "Skip to hangout night" and check in ("I'm here").  
8\. See the recap teaser and the group's streak (mock value, e.g. "3 months  
   in a row"; define it in the config).  
9\. Hit the paywall for the full recap and history, pay with the Stripe test  
   card shown on screen, and watch it unlock.  
\</juror\_path\>

\<what\_to\_build\>  
1\. "Pay my share" screen (step 7). Show these lines:  
   Share \$38.00  
   Partner discount −\$3.80  
   Booking fee \$2.00  
   Total \$36.20  
   Under the total: "Fee \$2.00, saved \$3.80."  
   Below that, a small skippable link: "Skip the fee with Hangout Pass."  
2\. Plans screen. Three columns: Free, Pay per hangout, Hangout Pass. Show  
   the cost and what's included for each. One main button:  
   "Get Hangout Pass – \$4.99/month" (yearly option on the checkout screen).  
3\. Pass checkout screen.  
   \- Monthly/yearly switch with both prices from the config.  
   \- Show the test card in plain sight above the pay button:  
     "Demo card: 4242 4242 4242 4242 · any future date · any CVC · any ZIP".  
   \- The pay button opens Stripe Checkout in test mode (subscription mode,  
     prices passed inline from the config, no Stripe account login for the  
     user). Create the session in a server route. On return, verify the  
     session on the server, then show a success state and save the Pass in  
     localStorage (guest, no account).  
   \- If the Stripe keys are missing or Stripe can't be reached, fall back  
     automatically to a mock card form with the same success state, so the  
     demo never breaks.  
4\. Pass active state. After purchase:  
   \- step 7 shows the fee as "\$0.00 with Pass" and the total \$34.20  
   \- the group screen shows a "Pass extras on" badge  
   \- a counter shows "0 of 4 fee-free bookings used this month"; it becomes  
     "1 of 4" after the next booking  
   \- voting shows 5 options instead of 3  
5\. Recap screen (step 10). Without the pass: show the teaser and streak plus  
   one quiet offer card under the stats that unlocks the full recap and  
   history. Do not cover the photos or the share button. With the pass: the  
   full recap and history are visible.  
6\. Settings screen with "Manage Pass": plan, price, next charge date, and a  
   cancel button (cancel is local/mock; no Stripe call needed).  
7\. Demo toggle (small, in a corner or in Settings): "has pass / no pass",  
   switches instantly, plus "Reset demo".  
\</what\_to\_build\>

\<design\_rules\>  
\- Mobile first, same width as the existing screens.  
\- One main action per screen.  
\- Simple words in all text. No jargon, no hype.  
\- Offers must be easy to skip. No pop-ups that block the flow.  
\</design\_rules\>

\<done\_when\>  
\- I can click through the whole juror path with no pass, then buy the pass  
  with the test card and click through again and see the changed prices,  
  badge, counter and unlocked recap.  
\- All money on screen is correct to the cent and comes from the config.  
\- The demo toggle switches "has pass / no pass" instantly.  
\- The app runs locally with one command, deploys to Vercel, and lists the  
  env vars I need (Stripe test keys). No console errors.  
\- You tell me what you tested and anything you could not finish.  
\</done\_when\>  
