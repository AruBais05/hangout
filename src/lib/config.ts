// All prices, rules and demo data live here. Money is always integer cents.
// Source: "Hangout business model and proof of willingness to pay" (Nov 15, 2026).

export const PRICES = {
  unlockCents: 499, // Big Plan unlock, once per plan, paid by the organizer
  passYearlyCents: 3999, // Crew Pass, yearly
  passMonthlyCents: 599, // Crew Pass, monthly
};

/** A plan is "big" if any of these is true. */
export const BIG_PLAN = {
  minDays: 2, // more than one day
  minPeople: 6, // six or more people
  budgetOverCents: 7500, // budget above $75 a person
};

export const DEMO_CARD = "4242 4242 4242 4242";

export const STREAK = { months: 3, label: "3 months in a row" };

export type Member = {
  id: string;
  name: string;
  initial: string;
  budgetCents: number; // private: never shown to the group
  vibe: "active" | "chill";
};

// Five sample members who already answered. With you, the group is six.
export const CREW: Member[] = [
  { id: "maya", name: "Maya", initial: "M", budgetCents: 25000, vibe: "active" },
  { id: "jordan", name: "Jordan", initial: "J", budgetCents: 18000, vibe: "active" },
  { id: "priya", name: "Priya", initial: "P", budgetCents: 30000, vibe: "chill" },
  { id: "leo", name: "Leo", initial: "L", budgetCents: 20000, vibe: "active" },
  { id: "sam", name: "Sam", initial: "S", budgetCents: 22000, vibe: "chill" },
];

export const GROUP_NAME = "The Saturday Crew";
export const PLAN_NAME = "Weekend away";

// Weekends to choose from, and the three parts of each weekend.
export const WEEKENDS = [
  { id: "nov20", label: "Nov 20–22", fri: "2026-11-20" },
  { id: "dec4", label: "Dec 4–6", fri: "2026-12-04" },
  { id: "dec11", label: "Dec 11–13", fri: "2026-12-11" },
  { id: "jan8", label: "Jan 8–10", fri: "2027-01-08" },
] as const;
export const PARTS = ["Fri night", "Sat", "Sun"] as const;
export type WeekendId = (typeof WEEKENDS)[number]["id"];
export type Part = (typeof PARTS)[number];
export type SlotKey = `${WeekendId}|${Part}`;

// When each sample member is free. Dec 4–6 is the one whole weekend everyone shares.
export const CREW_AVAILABILITY: Record<string, SlotKey[]> = {
  maya: ["nov20|Sat", "dec4|Fri night", "dec4|Sat", "dec4|Sun", "dec11|Sat", "dec11|Sun"],
  jordan: ["dec4|Fri night", "dec4|Sat", "dec4|Sun", "jan8|Fri night", "jan8|Sat"],
  priya: ["nov20|Fri night", "nov20|Sat", "dec4|Fri night", "dec4|Sat", "dec4|Sun", "dec11|Sun"],
  leo: ["dec4|Fri night", "dec4|Sat", "dec4|Sun", "dec11|Fri night", "dec11|Sat", "dec11|Sun"],
  sam: ["nov20|Sun", "dec4|Fri night", "dec4|Sat", "dec4|Sun", "jan8|Sat", "jan8|Sun"],
};

export type Option = {
  id: string;
  title: string;
  place: string;
  address: string;
  vibe: "active" | "chill";
  totalCents: number; // whole group, paid to the venue directly
  partner: boolean; // booked through a partner link (partner pays Hangout, not you)
  partnerUrl: string;
};

export const OPTIONS: Option[] = [
  {
    id: "cabin",
    title: "Cabin in the Catskills",
    place: "Pine Hollow Cabins",
    address: "Phoenicia, NY",
    vibe: "active",
    totalCents: 102000,
    partner: true,
    partnerUrl: "https://example.com/partner/pine-hollow",
  },
  {
    id: "beach",
    title: "Beach house in Montauk",
    place: "Ditch Plains House",
    address: "Montauk, NY",
    vibe: "chill",
    totalCents: 138000,
    partner: false,
    partnerUrl: "https://example.com/montauk",
  },
  {
    id: "farm",
    title: "Farm stay in the Hudson Valley",
    place: "Old Mill Farm",
    address: "Rhinebeck, NY",
    vibe: "chill",
    totalCents: 84000,
    partner: false,
    partnerUrl: "https://example.com/old-mill",
  },
];

// The weekend the plan lands on, and its timing for calendar files.
export const PLAN_WEEKEND: WeekendId = "dec4";
export const TRIP = { start: "2026-12-04T18:00", end: "2026-12-06T16:00" };

// Pre-filled votes from the sample crew.
export const CREW_VOTES: Record<string, string> = {
  maya: "cabin",
  jordan: "cabin",
  priya: "beach",
  leo: "cabin",
  sam: "farm",
};

export const ANSWER_BY = "Wed, Nov 25, 6:00 PM";

// Past hangouts shown in the group history (Crew Pass).
export const HISTORY = [
  { date: "Oct 17", title: "Karaoke night", place: "Sing Sing Avenue A", went: 5 },
  { date: "Sep 13", title: "Picnic and frisbee", place: "Prospect Park", went: 4 },
];

// The next hangout Hangout proposes on its own (Crew Pass).
export const NEXT_PROPOSAL = {
  title: "Bouldering, then tacos",
  when: "Sat Jan 9, 7:30 PM",
  why: "Everyone's free that evening and it fits every budget",
};

export const RECAP = {
  firstThrough: { name: "Maya", time: "Fri 6:12 PM" },
  photos: [
    { caption: "First night by the fire", shape: "fire" },
    { caption: "The view from Giant Ledge", shape: "summit" },
    { caption: "Six people, one pancake stack", shape: "stack" },
    { caption: "Group photo on the porch", shape: "group" },
  ],
};

export const PLAN_FEATURES = {
  everyday: [
    "Dates, budget and vibe matching",
    "Three options and a group vote",
    "The plan on everyone's calendar",
    "A recap after",
  ],
  unlock: [
    "Private budget match: nobody says a number out loud",
    "Who's really in: a yes-or-no deadline before anyone books",
    "Dates across a whole weekend",
    "Cost split with settle-up links",
    "Reminders to people who haven't answered",
  ],
  pass: [
    "Unlimited big plans",
    "The next hangout proposed automatically",
    "Full group history",
  ],
};
