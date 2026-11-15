// All prices, limits and demo data live here. Money is always integer cents.

export const PRICES = {
  bookingFeeCents: 200, // $2.00 per person per booked hangout
  partnerDiscountPct: 10, // 10% off the share at partner venues
  passMonthlyCents: 499, // Hangout Pass, monthly
  passYearlyCents: 3999, // Hangout Pass, yearly
};

export const LIMITS = {
  feeFreeBookingsPerMonth: 4, // Pass holder pays no fee on this many bookings a month
  voteOptionsFree: 3,
  voteOptionsPass: 5,
  voteSeconds: 90, // voting timer
};

export const DEMO_CARD = "4242 4242 4242 4242";

export const STREAK = { months: 3, label: "3 months in a row" };

export type Member = {
  id: string;
  name: string;
  initial: string;
  budgetCents: number;
  vibe: "active" | "chill";
};

// Four sample members who already answered the quiz and availability.
export const CREW: Member[] = [
  { id: "maya", name: "Maya", initial: "M", budgetCents: 5000, vibe: "active" },
  { id: "jordan", name: "Jordan", initial: "J", budgetCents: 4000, vibe: "active" },
  { id: "priya", name: "Priya", initial: "P", budgetCents: 6000, vibe: "chill" },
  { id: "leo", name: "Leo", initial: "L", budgetCents: 4500, vibe: "active" },
];

export const GROUP_NAME = "The Saturday Crew";

export const DAYS = ["Thu", "Fri", "Sat", "Sun"] as const;
export const SLOTS = ["Afternoon", "Evening", "Late"] as const;
export type Day = (typeof DAYS)[number];
export type Slot = (typeof SLOTS)[number];
export type SlotKey = `${Day}-${Slot}`;

// Calendar dates for the demo week.
export const DAY_DATES: Record<Day, string> = {
  Thu: "2026-11-19",
  Fri: "2026-11-20",
  Sat: "2026-11-21",
  Sun: "2026-11-22",
};

export const SLOT_TIMES: Record<Slot, { start: string; label: string }> = {
  Afternoon: { start: "14:00", label: "2:00 PM" },
  Evening: { start: "19:30", label: "7:30 PM" },
  Late: { start: "21:30", label: "9:30 PM" },
};

// When each sample member is free.
export const CREW_AVAILABILITY: Record<string, SlotKey[]> = {
  maya: ["Fri-Evening", "Sat-Afternoon", "Sat-Evening", "Sun-Afternoon"],
  jordan: ["Thu-Evening", "Sat-Afternoon", "Sat-Evening", "Sat-Late"],
  priya: ["Fri-Evening", "Sat-Evening", "Sun-Afternoon", "Sun-Evening"],
  leo: ["Fri-Evening", "Fri-Late", "Sat-Evening", "Sun-Afternoon"],
};

export type Option = {
  id: string;
  title: string;
  venue: string;
  address: string;
  vibe: "active" | "chill";
  shareCents: number; // per person, before discount and fee
  partner: boolean;
  slot: SlotKey;
  minutes: number;
  passOnly?: boolean; // the 4th and 5th options show only with the Pass
};

export const OPTIONS: Option[] = [
  {
    id: "boulder",
    title: "Bouldering, then tacos",
    venue: "Brooklyn Boulders",
    address: "575 Degraw St, Brooklyn, NY",
    vibe: "active",
    shareCents: 3800,
    partner: true,
    slot: "Sat-Evening",
    minutes: 180,
  },
  {
    id: "pottery",
    title: "Pottery night",
    venue: "Clay Space Studio",
    address: "112 N 6th St, Brooklyn, NY",
    vibe: "chill",
    shareCents: 4200,
    partner: false,
    slot: "Sun-Afternoon",
    minutes: 150,
  },
  {
    id: "karaoke",
    title: "Karaoke room",
    venue: "Sing Sing Avenue A",
    address: "81 Avenue A, New York, NY",
    vibe: "chill",
    shareCents: 2600,
    partner: false,
    slot: "Fri-Evening",
    minutes: 120,
  },
  {
    id: "bowling",
    title: "Bowling and arcade",
    venue: "Frames Bowling Lounge",
    address: "550 9th Ave, New York, NY",
    vibe: "active",
    shareCents: 3400,
    partner: false,
    slot: "Sat-Afternoon",
    minutes: 150,
    passOnly: true,
  },
  {
    id: "picnic",
    title: "Picnic and frisbee",
    venue: "Prospect Park Long Meadow",
    address: "Prospect Park, Brooklyn, NY",
    vibe: "active",
    shareCents: 1200,
    partner: false,
    slot: "Sun-Afternoon",
    minutes: 180,
    passOnly: true,
  },
];

// Pre-filled votes from the sample crew (option id per member).
export const CREW_VOTES: Record<string, string> = {
  maya: "boulder",
  jordan: "boulder",
  priya: "pottery",
  leo: "boulder",
};

export const PLAN_FEATURES = {
  free: [
    "Unlimited groups",
    "Find a time, vote and check in",
    "Hangouts with no booking cost nothing",
  ],
  perHangout: [
    "Everything in Free",
    "We book the venue for your group",
    "10% off your share at partner venues",
  ],
  pass: [
    "No booking fee on 4 hangouts a month",
    "5 options to vote on instead of 3",
    "Auto-plan, trip mode and surprise mode",
    "Full recap and recap history",
    "Extras unlock for your whole group",
  ],
};
