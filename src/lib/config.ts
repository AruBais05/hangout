// All prices, rules and demo data live here. Money is always integer cents.
// Business model: "Hangout business model and proof of willingness to pay" (Nov 15, 2026).

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
export const STREAK_LABEL = "3 months in a row";
export const ROOM_CODE = "HX7-K2Q";
export const MAX_DAYS = 10; // longest date range you can pick
export const PEOPLE = { min: 2, max: 12 };

/* ---------- what the meeting is for ---------- */

export type PurposeId = "food" | "active" | "chill" | "birthday" | "trip";
export type Personality = "adventurer" | "host" | "explorer" | "chill";

export type Idea = {
  id: string;
  title: string;
  place: string;
  area: string;
  eachCents: number; // per person, paid at the venue
  partner: boolean; // partner pays Hangout a commission; never the user
  fits: Personality[];
  slots: Slot[]; // times of day this idea works for
};

export const PURPOSES: {
  id: PurposeId;
  label: string;
  hint: string;
  days: number;
  ideas: Idea[];
}[] = [
  {
    id: "food",
    label: "Food & drinks",
    hint: "Dinner, brunch, a bar",
    days: 1,
    ideas: [
      { id: "tacos", title: "Taco crawl in Bushwick", place: "Los Hermanos + 2 more", area: "Bushwick", eachCents: 2200, partner: true, fits: ["explorer", "adventurer"], slots: ["Evening"] },
      { id: "brunch", title: "Long brunch", place: "Sunday in Brooklyn", area: "Williamsburg", eachCents: 3400, partner: false, fits: ["host", "chill"], slots: ["Morning", "Afternoon"] },
      { id: "dumplings", title: "Dumpling dinner", place: "Nom Wah Tea Parlor", area: "Chinatown", eachCents: 1800, partner: false, fits: ["chill", "host"], slots: ["Evening"] },
      { id: "rooftop", title: "Rooftop happy hour", place: "Westlight", area: "Williamsburg", eachCents: 2800, partner: false, fits: ["host", "adventurer"], slots: ["Evening"] },
    ],
  },
  {
    id: "active",
    label: "Something active",
    hint: "Climb, bowl, move",
    days: 1,
    ideas: [
      { id: "boulder", title: "Bouldering, then tacos", place: "Brooklyn Boulders", area: "Gowanus", eachCents: 3800, partner: true, fits: ["adventurer", "explorer"], slots: ["Afternoon", "Evening"] },
      { id: "bowling", title: "Bowling and arcade", place: "Frames Bowling Lounge", area: "Midtown", eachCents: 3000, partner: false, fits: ["host", "chill"], slots: ["Afternoon", "Evening"] },
      { id: "kayak", title: "Free kayaking on the Hudson", place: "Pier 26 Boathouse", area: "Tribeca", eachCents: 0, partner: false, fits: ["adventurer"], slots: ["Morning", "Afternoon"] },
    ],
  },
  {
    id: "chill",
    label: "Chill night",
    hint: "Games, a movie, a class",
    days: 1,
    ideas: [
      { id: "games", title: "Board game café", place: "Hex & Co.", area: "Upper West Side", eachCents: 1200, partner: true, fits: ["chill", "host"], slots: ["Afternoon", "Evening"] },
      { id: "pottery", title: "Pottery class", place: "Clay Space Studio", area: "Williamsburg", eachCents: 4500, partner: false, fits: ["explorer", "chill"], slots: ["Afternoon", "Evening"] },
      { id: "cinema", title: "Indie movie night", place: "Nitehawk Cinema", area: "Williamsburg", eachCents: 1600, partner: false, fits: ["chill", "explorer"], slots: ["Evening"] },
    ],
  },
  {
    id: "birthday",
    label: "Birthday",
    hint: "Someone's big day",
    days: 1,
    ideas: [
      { id: "karaoke", title: "Private karaoke room", place: "Sing Sing Avenue A", area: "East Village", eachCents: 3500, partner: true, fits: ["host", "adventurer"], slots: ["Evening"] },
      { id: "dinner", title: "Long table dinner", place: "Lilia", area: "Williamsburg", eachCents: 5500, partner: false, fits: ["host", "chill"], slots: ["Evening"] },
      { id: "party-bowl", title: "Bowling party", place: "Brooklyn Bowl", area: "Williamsburg", eachCents: 3200, partner: false, fits: ["adventurer", "host"], slots: ["Afternoon", "Evening"] },
    ],
  },
  {
    id: "trip",
    label: "Weekend trip",
    hint: "2 nights away",
    days: 2,
    ideas: [
      { id: "cabin", title: "Cabin in the Catskills", place: "Pine Hollow Cabins", area: "Phoenicia, NY", eachCents: 17000, partner: true, fits: ["adventurer", "chill"], slots: ["Afternoon"] },
      { id: "farm", title: "Farm stay in the Hudson Valley", place: "Old Mill Farm", area: "Rhinebeck, NY", eachCents: 14000, partner: false, fits: ["chill", "host"], slots: ["Afternoon"] },
      { id: "beach", title: "Beach house in Montauk", place: "Ditch Plains House", area: "Montauk, NY", eachCents: 23000, partner: false, fits: ["explorer", "host"], slots: ["Afternoon"] },
    ],
  },
];

/* ---------- availability ---------- */

export const SLOTS = ["Morning", "Afternoon", "Evening"] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_HOURS: Record<Slot, { from: number; to: number; start: string; time: string; label: string }> = {
  Morning: { from: 9, to: 12, start: "10:00", time: "10 AM", label: "9–12" },
  Afternoon: { from: 12, to: 18, start: "14:00", time: "2 PM", label: "12–6" },
  Evening: { from: 18, to: 22, start: "19:30", time: "7:30 PM", label: "6–10" },
};

/** Mock schedule used by "Connect calendar (demo)". Days: 0 = Sunday … 6 = Saturday. */
export const MOCK_SCHEDULE = [
  { label: "Work", days: [1, 2, 3, 4, 5], from: 9, to: 18 },
  { label: "Gym", days: [2, 4], from: 19, to: 20 },
];

/* ---------- personality quiz ---------- */

export const PERSONALITIES: Record<Personality, { name: string; line: string }> = {
  adventurer: { name: "The Adventurer", line: "Up for anything that moves." },
  host: { name: "The Host", line: "Brings everyone together." },
  explorer: { name: "The Explorer", line: "Always finds the new spot." },
  chill: { name: "The Chill One", line: "Here for good company." },
};

export type QuizQuestion = {
  id: string;
  q: string;
  multi?: boolean;
  options: { label: string; type?: Personality }[];
};

export const QUIZ: QuizQuestion[] = [
  {
    id: "saturday",
    q: "A perfect Saturday starts with…",
    options: [
      { label: "An early hike or a climb", type: "adventurer" },
      { label: "A long brunch with friends", type: "host" },
      { label: "A place nobody's tried yet", type: "explorer" },
      { label: "Sleeping in, then something cozy", type: "chill" },
    ],
  },
  {
    id: "role",
    q: "In a group chat, you're the one…",
    options: [
      { label: "Making the plan", type: "host" },
      { label: "Hyping it up", type: "adventurer" },
      { label: "Sending the hidden-gem link", type: "explorer" },
      { label: "Happy to tag along", type: "chill" },
    ],
  },
  {
    id: "night",
    q: "Pick a night out:",
    options: [
      { label: "Loud and packed", type: "adventurer" },
      { label: "Small and cozy", type: "chill" },
      { label: "Something weird and new", type: "explorer" },
      { label: "Big table, everyone invited", type: "host" },
    ],
  },
  {
    id: "distance",
    q: "How far will you travel?",
    options: [{ label: "Walking distance" }, { label: "Up to 30 minutes" }, { label: "Anywhere, it's an adventure" }],
  },
  {
    id: "food",
    q: "Any food rules?",
    multi: true,
    options: [{ label: "None" }, { label: "Vegetarian" }, { label: "Vegan" }, { label: "Halal" }, { label: "Gluten-free" }],
  },
];

/** Private budget choices: everyday plans vs. trips. */
export const BUDGETS = {
  day: [1500, 4000, 7500, 15000],
  trip: [10000, 20000, 30000, 40000],
};

/* ---------- the demo crew ---------- */

export type Member = {
  id: string;
  name: string;
  type: Personality;
  budget: { day: number; trip: number }; // private
};

// Up to 11 sample friends. A meeting for N people uses the first N − 1.
export const CREW_POOL: Member[] = [
  { id: "maya", name: "Maya", type: "adventurer", budget: { day: 6000, trip: 25000 } },
  { id: "jordan", name: "Jordan", type: "host", budget: { day: 4500, trip: 18000 } },
  { id: "priya", name: "Priya", type: "explorer", budget: { day: 8000, trip: 30000 } },
  { id: "leo", name: "Leo", type: "adventurer", budget: { day: 5000, trip: 20000 } },
  { id: "sam", name: "Sam", type: "chill", budget: { day: 4000, trip: 22000 } },
  { id: "nia", name: "Nia", type: "host", budget: { day: 7000, trip: 26000 } },
  { id: "omar", name: "Omar", type: "explorer", budget: { day: 5500, trip: 19000 } },
  { id: "zoe", name: "Zoe", type: "chill", budget: { day: 4200, trip: 21000 } },
  { id: "ben", name: "Ben", type: "adventurer", budget: { day: 9000, trip: 35000 } },
  { id: "ivy", name: "Ivy", type: "explorer", budget: { day: 6500, trip: 24000 } },
  { id: "raf", name: "Raf", type: "host", budget: { day: 5000, trip: 20000 } },
];

export const DEFAULT_MEETING = {
  purpose: "active" as PurposeId,
  from: "2026-11-16",
  to: "2026-11-22",
  people: 5,
};

/* ---------- Crew Pass extras ---------- */

export const HISTORY = [
  { date: "Oct 17", title: "Karaoke night", place: "Sing Sing Avenue A", went: 5 },
  { date: "Sep 13", title: "Picnic and frisbee", place: "Prospect Park", went: 4 },
];

export const NEXT_PROPOSAL = {
  title: "Dumpling dinner",
  when: "Sat Dec 12, 7:30 PM",
  why: "Everyone's free that evening and it fits every budget",
};

export const PLAN_FEATURES = {
  everyday: [
    "Dates, budget and vibe matching",
    "Three ideas and a group vote",
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
  pass: ["Unlimited big plans", "The next hangout proposed automatically", "Full group history"],
};
