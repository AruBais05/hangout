// All prices, rules, AI settings and demo data live here. Money is always integer cents.

/* ---------- money ---------- */

export const PRICES = {
  unlockCents: 499, // Big Plan unlock, once per big plan, for users without Crew Pass
  passYearlyCents: 3999, // Crew Pass, yearly only
  partnerDiscountPct: 10, // off the share at partner venues
};
// Planning, voting, booking links and settle-up are free. There is no booking fee.

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
export const PEOPLE = { min: 2, max: 50 }; // a hangout is full at 50

/* ---------- AI ---------- */

export type AiProvider = "groq" | "gemini" | "anthropic";

/**
 * Which AI writes the plans and the quiz. Switch `provider` to change it; the routes don't change.
 * Each provider reads its own server-only key: GROQ_API_KEY, GEMINI_API_KEY or ANTHROPIC_API_KEY.
 */
export const AI = {
  provider: "groq" as AiProvider,
  models: {
    // Groq. Llama 3.3 70B isn't available on this free-tier key (404), so we use OpenAI's open-weight
    // model on Groq. Other ids this key can use: "openai/gpt-oss-20b" (faster), "qwen/qwen3.8-27b".
    groq: "openai/gpt-oss-120b",
    // Gemini through its OpenAI-compatible endpoint. Check aistudio.google.com/docs/openai for current ids.
    gemini: "gemini-3.8-flash",
    anthropic: "claude-haiku-5-5",
  } satisfies Record<AiProvider, string>,
  maxTokens: 3000, // reasoning models spend some of this thinking, so 1500 could cut 5 plans short
  reasoningEffort: "low" as const, // gpt-oss on Groq: low keeps replies fast
  temperature: 0.7, // ignored for anthropic: Claude Haiku 5.5 rejects non-default sampling values
  timeoutMs: 8000,
  rateLimit: { calls: 10, windowMs: 10 * 60 * 1000 }, // per IP
  cacheMs: 60 * 60 * 1000,
};

/* ---------- city ---------- */

export const DEFAULT_CITY = { name: "Austin, TX", center: [30.2672, -97.7431] as [number, number] };
export const TRAVEL_MINUTES = [15, 30, 45] as const;
export type TravelMinutes = (typeof TRAVEL_MINUTES)[number];

/* ---------- what the meeting is for ---------- */

export type PurposeId = "food" | "active" | "chill" | "birthday" | "trip";
export type Vibe = "active" | "chill";

export const PURPOSES: { id: PurposeId; label: string; hint: string; days: number; vibe: Vibe }[] = [
  { id: "food", label: "Food & drinks", hint: "Dinner, brunch, a bar", days: 1, vibe: "chill" },
  { id: "active", label: "Something active", hint: "Climb, bowl, move", days: 1, vibe: "active" },
  { id: "chill", label: "Chill night", hint: "Games, a movie, a class", days: 1, vibe: "chill" },
  { id: "birthday", label: "Birthday", hint: "Someone's big day", days: 1, vibe: "active" },
  { id: "trip", label: "Weekend trip", hint: "2 nights away", days: 2, vibe: "active" },
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

/* ---------- hangout types and quiz ---------- */

export type Personality = "explorer" | "homebody" | "nightowl" | "planner";
export const TYPE_ORDER: Personality[] = ["explorer", "nightowl", "planner", "homebody"];

export const PERSONALITIES: Record<Personality, { name: string; plural: string; line: string }> = {
  explorer: { name: "Explorer", plural: "Explorers", line: "Always up for the new spot." },
  homebody: { name: "Homebody", plural: "Homebodies", line: "Cozy, close and good company." },
  nightowl: { name: "Night owl", plural: "Night owls", line: "Comes alive after dark." },
  planner: { name: "Planner", plural: "Planners", line: "Has the plan, the backup and the snacks." },
};

/** A personality question. The same shape whether we wrote it or the AI did. */
export type QuizQuestion = { text: string; answers: { text: string; points: Partial<Record<Personality, 1 | 2>> }[] };
export type GroupQuiz = { source: "ai" | "fixed" | "demo"; questions: QuizQuestion[] };

/** Fixed quiz: used when the AI is off, slow or wrong. */
export const FIXED_QUIZ: QuizQuestion[] = [
  {
    text: "A perfect Saturday starts with…",
    answers: [
      { text: "A place nobody's tried yet", points: { explorer: 2 } },
      { text: "Sleeping in, then coffee at home", points: { homebody: 2 } },
      { text: "Nothing until noon, out till late", points: { nightowl: 2 } },
      { text: "A list, already half done", points: { planner: 2 } },
    ],
  },
  {
    text: "In the group chat, you're the one who…",
    answers: [
      { text: "Sends the hidden-gem link", points: { explorer: 2 } },
      { text: "Says 'or we could stay in'", points: { homebody: 2 } },
      { text: "Replies at 1 AM", points: { nightowl: 2 } },
      { text: "Makes the poll", points: { planner: 2 } },
    ],
  },
  {
    text: "Pick a night out:",
    answers: [
      { text: "Something weird and new", points: { explorer: 2, nightowl: 1 } },
      { text: "Small, cozy, home by ten", points: { homebody: 2 } },
      { text: "Loud, late, one more stop", points: { nightowl: 2 } },
      { text: "Booked table, everyone on time", points: { planner: 2 } },
    ],
  },
  {
    text: "Your friends would say you're good at…",
    answers: [
      { text: "Finding the spot", points: { explorer: 2 } },
      { text: "Making people feel at home", points: { homebody: 2 } },
      { text: "Keeping the night going", points: { nightowl: 2 } },
      { text: "Getting everyone there", points: { planner: 2 } },
    ],
  },
  {
    text: "Plans change last minute. You…",
    answers: [
      { text: "Love it, let's improvise", points: { explorer: 1, nightowl: 1 } },
      { text: "Happily go home", points: { homebody: 2 } },
      { text: "Already have plan B", points: { planner: 2 } },
    ],
  },
];

/** Pre-written quiz for the demo group, so the juror path never waits on the AI. */
export const DEMO_QUIZ: QuizQuestion[] = [
  {
    text: "Friday after work, where do you land?",
    answers: [
      { text: "A food truck I haven't tried", points: { explorer: 2 } },
      { text: "My couch, snacks ready", points: { homebody: 2 } },
      { text: "Wherever there's live music", points: { nightowl: 2 } },
      { text: "The spot I booked Tuesday", points: { planner: 2 } },
    ],
  },
  {
    text: "Pick the best kind of tired:",
    answers: [
      { text: "Legs sore from a new trail", points: { explorer: 2 } },
      { text: "Full from a long dinner", points: { homebody: 1, planner: 1 } },
      { text: "Up past 2 AM again", points: { nightowl: 2 } },
    ],
  },
  {
    text: "A friend is visiting town. You…",
    answers: [
      { text: "Show them somewhere off the map", points: { explorer: 2 } },
      { text: "Cook for them at home", points: { homebody: 2 } },
      { text: "Take them out late", points: { nightowl: 2 } },
      { text: "Send a day-by-day plan", points: { planner: 2 } },
    ],
  },
  {
    text: "What makes a hangout great?",
    answers: [
      { text: "Something we've never done", points: { explorer: 2 } },
      { text: "Easy talk, no rush", points: { homebody: 2 } },
      { text: "Good energy that runs late", points: { nightowl: 2 } },
      { text: "Everyone actually shows up", points: { planner: 2 } },
    ],
  },
  {
    text: "Your phone's most-used app on weekends:",
    answers: [
      { text: "Maps", points: { explorer: 2 } },
      { text: "Streaming", points: { homebody: 2 } },
      { text: "Group chat at midnight", points: { nightowl: 2 } },
      { text: "Calendar", points: { planner: 2 } },
    ],
  },
];

/* ---------- fixed questions ---------- */

export type BudgetRangeId = "u25" | "25to50" | "50to100" | "flex";

/** The group budget is the lowest of everyone's upper bounds. */
export const BUDGET_RANGES: { id: BudgetRangeId; label: string; capCents: number }[] = [
  { id: "u25", label: "Under $25", capCents: 2500 },
  { id: "25to50", label: "$25–50", capCents: 5000 },
  { id: "50to100", label: "$50–100", capCents: 10000 },
  { id: "flex", label: "Flexible", capCents: 15000 },
];

export const DEAL_BREAKERS = ["None", "Loud places", "Long walks", "Late nights", "Drinking-focused", "Big crowds"];

/* ---------- the demo crew ---------- */

export type Member = {
  id: string;
  name: string;
  type: Personality;
  budget: BudgetRangeId; // private
  offset: [number, number]; // rough home, as lat/lng offset from the city center (moves with the city)
  travel: TravelMinutes;
};

// Up to 11 sample friends. A meeting for N people uses the first N − 1.
export const CREW_POOL: Member[] = [
  { id: "maya", name: "Maya", type: "explorer", budget: "50to100", offset: [0.004, 0.035], travel: 30 },
  { id: "jordan", name: "Jordan", type: "planner", budget: "25to50", offset: [0.045, -0.012], travel: 30 },
  { id: "priya", name: "Priya", type: "nightowl", budget: "50to100", offset: [-0.032, -0.006], travel: 45 },
  { id: "leo", name: "Leo", type: "homebody", budget: "flex", offset: [0.012, -0.041], travel: 15 },
  { id: "sam", name: "Sam", type: "homebody", budget: "25to50", offset: [-0.051, 0.028], travel: 30 },
  { id: "nia", name: "Nia", type: "planner", budget: "50to100", offset: [0.062, 0.018], travel: 30 },
  { id: "omar", name: "Omar", type: "explorer", budget: "25to50", offset: [-0.018, 0.052], travel: 45 },
  { id: "zoe", name: "Zoe", type: "nightowl", budget: "flex", offset: [0.027, 0.009], travel: 30 },
  { id: "ben", name: "Ben", type: "explorer", budget: "50to100", offset: [-0.066, -0.031], travel: 30 },
  { id: "ivy", name: "Ivy", type: "planner", budget: "flex", offset: [0.081, -0.044], travel: 15 },
  { id: "raf", name: "Raf", type: "nightowl", budget: "25to50", offset: [-0.009, -0.072], travel: 30 },
];

export const DEFAULT_MEETING = {
  purpose: "active" as PurposeId,
  vibe: "active" as Vibe,
  from: "2026-11-16",
  to: "2026-11-22",
  people: 5,
};

/* ---------- partners ---------- */

export type Partner = {
  name: string;
  neighborhood: string;
  category: string;
  eachCents: number;
  lat: number;
  lng: number;
  partner: true;
  demo: true; // demo data until real partner deals are signed
  bookingUrl: string | null; // the venue's own site, checked by hand; null if we couldn't confirm it
};

/** Partner venues per city (lower-case "city, st"). Demo data: not confirmed partners yet. */
export const PARTNERS: Record<string, Partner[]> = {
  "austin, tx": [
    { name: "Austin Bouldering Project", neighborhood: "East Austin", category: "climbing gym, gear included", eachCents: 3800, lat: 30.2603, lng: -97.6965, partner: true, demo: true, bookingUrl: "https://boulderingproject.com/market/austin-texas/" },
    { name: "Mozart's Coffee Roasters", neighborhood: "Lake Austin", category: "lakeside coffee and dessert", eachCents: 1500, lat: 30.2953, lng: -97.7846, partner: true, demo: true, bookingUrl: "https://mozartscoffee.com/" },
    { name: "ColdTowne Theater", neighborhood: "North Loop", category: "improv comedy show", eachCents: 2000, lat: 30.3176, lng: -97.7182, partner: true, demo: true, bookingUrl: "https://coldtownetheater.com/" },
    { name: "Kung Fu Saloon", neighborhood: "Rainey Street", category: "bar with arcade games", eachCents: 3000, lat: 30.2587, lng: -97.7389, partner: true, demo: true, bookingUrl: null },
  ],
};

export function partnersFor(city: string): Partner[] {
  return PARTNERS[city.trim().toLowerCase()] ?? [];
}

/* ---------- sample plans (fallback when the AI is off, slow or wrong) ---------- */

export type SamplePlan = {
  title: string;
  summary: string;
  neighborhood: string;
  offsetMinutes: number; // start this long after the time window opens
  eachCents: number;
  steps: string[];
  fits: Personality[];
  searchHint: string;
  partnerName: string | null;
  vibe: Vibe | "any";
};

/** Austin samples. The first one is the $38.00 partner plan the juror path expects. */
export const SAMPLE_PLANS: Record<string, SamplePlan[]> = {
  "austin, tx": [
    {
      title: "Bouldering, then tacos",
      summary: "Climb easy routes together, then walk to East Austin taco trucks.",
      neighborhood: "East Austin",
      offsetMinutes: 90,
      eachCents: 3800,
      steps: ["Meet at Austin Bouldering Project", "Climb for an hour, gear included", "Tacos at a nearby truck"],
      fits: ["explorer", "planner"],
      searchHint: "Austin Bouldering Project",
      partnerName: "Austin Bouldering Project",
      vibe: "active",
    },
    {
      title: "Improv night, North Loop",
      summary: "Catch a short improv set, then grab late snacks nearby.",
      neighborhood: "North Loop",
      offsetMinutes: 60,
      eachCents: 2000,
      steps: ["Meet at ColdTowne Theater", "Watch the improv show", "Late bite on North Loop Blvd"],
      fits: ["nightowl", "homebody"],
      searchHint: "ColdTowne Theater",
      partnerName: "ColdTowne Theater",
      vibe: "chill",
    },
    {
      title: "Lady Bird Lake paddle",
      summary: "Rent paddleboards on the lake, then cool off with drinks on the shore.",
      neighborhood: "Zilker",
      offsetMinutes: 0,
      eachCents: 3000,
      steps: ["Meet at a paddleboard rental", "Paddle for an hour", "Drinks by the water"],
      fits: ["explorer"],
      searchHint: "paddleboard rental Lady Bird Lake",
      partnerName: null,
      vibe: "active",
    },
    {
      title: "Lakeside coffee and cake",
      summary: "Slow coffee and dessert on the deck over Lake Austin.",
      neighborhood: "Lake Austin",
      offsetMinutes: 30,
      eachCents: 1500,
      steps: ["Meet at Mozart's Coffee Roasters", "Share desserts on the deck", "Short walk by the water"],
      fits: ["homebody", "planner"],
      searchHint: "Mozart's Coffee Roasters",
      partnerName: "Mozart's Coffee Roasters",
      vibe: "chill",
    },
    {
      title: "Rainey Street game night",
      summary: "Arcade games and drinks in a bungalow bar on Rainey Street.",
      neighborhood: "Rainey Street",
      offsetMinutes: 120,
      eachCents: 3000,
      steps: ["Meet at Kung Fu Saloon", "Play arcade and yard games", "Walk the street after"],
      fits: ["nightowl", "explorer"],
      searchHint: "Kung Fu Saloon Rainey Street",
      partnerName: "Kung Fu Saloon",
      vibe: "active",
    },
  ],
};

/** For any other city: plans with no venue names, so nothing is made up. */
export const GENERIC_SAMPLES: SamplePlan[] = [
  {
    title: "Climbing gym, then dinner",
    summary: "Try easy climbing routes together, then share a casual dinner nearby.",
    neighborhood: "Central {city}",
    offsetMinutes: 60,
    eachCents: 3500,
    steps: ["Meet at a climbing gym", "Climb for an hour", "Casual dinner nearby"],
    fits: ["explorer", "planner"],
    searchHint: "climbing gym",
    partnerName: null,
    vibe: "active",
  },
  {
    title: "Board game café night",
    summary: "Pick a few games, order snacks, and settle in for a cozy evening.",
    neighborhood: "Central {city}",
    offsetMinutes: 30,
    eachCents: 1500,
    steps: ["Meet at a board game café", "Play two or three games", "Dessert if you're hungry"],
    fits: ["homebody", "planner"],
    searchHint: "board game cafe",
    partnerName: null,
    vibe: "chill",
  },
  {
    title: "Comedy show, late bite",
    summary: "Catch a stand-up or improv show, then find late-night food.",
    neighborhood: "Downtown {city}",
    offsetMinutes: 90,
    eachCents: 2500,
    steps: ["Meet at a comedy club", "Watch the show", "Late-night food after"],
    fits: ["nightowl", "explorer"],
    searchHint: "comedy club",
    partnerName: null,
    vibe: "chill",
  },
  {
    title: "Food hall crawl",
    summary: "Everyone picks one stall, then you share plates at one long table.",
    neighborhood: "Downtown {city}",
    offsetMinutes: 0,
    eachCents: 2500,
    steps: ["Meet at a food hall", "Each picks a stall", "Share at one table"],
    fits: ["explorer", "homebody"],
    searchHint: "food hall",
    partnerName: null,
    vibe: "any",
  },
  {
    title: "Bowling and arcade",
    summary: "A few frames of bowling and some arcade games with snacks.",
    neighborhood: "Central {city}",
    offsetMinutes: 60,
    eachCents: 3000,
    steps: ["Meet at a bowling alley", "Bowl two games", "Arcade and snacks"],
    fits: ["nightowl", "planner"],
    searchHint: "bowling alley",
    partnerName: null,
    vibe: "active",
  },
];

/* ---------- Crew Pass extras ---------- */

export const HISTORY = [
  { date: "Oct 17", title: "Karaoke night", place: "Rainey Street", went: 5 },
  { date: "Sep 13", title: "Picnic and frisbee", place: "Zilker Park", went: 4 },
];

export const NEXT_PROPOSAL = {
  title: "Taco crawl",
  when: "Sat Dec 12, 7:30 PM",
  why: "Everyone's free that evening and it fits every budget",
};

export const PLAN_FEATURES = {
  everyday: [
    "Dates, budget and vibe matching",
    "3 AI-planned ideas and a group vote",
    "Booking links and the plan on everyone's calendar",
    "Settle up with Venmo links",
  ],
  unlock: [
    "Private budget match: nobody says a number out loud",
    "Who's really in: a yes-or-no deadline before anyone books",
    "Dates across a whole weekend",
    "Groups of 6 to 50 people",
  ],
  pass: [
    "5 ideas to vote on instead of 3",
    "Unlimited big plans, no unlock",
    "Cost split: add expenses, see who owes whom",
    "My spending: what you spend on hangouts, private to you",
    "Full group history",
  ],
};

/* ---------- demo data for big groups and spending ---------- */

/** First names for demo friends beyond the 11 above (big groups go up to 50). */
export const EXTRA_NAMES = [
  "Ali", "Dana", "Theo", "Mia", "Kai", "Lena", "Noah", "Ruby", "Eli", "Ava", "Sol", "June", "Max", "Isla", "Remy",
  "Nora", "Finn", "Cleo", "Jude", "Tess", "Ezra", "Lila", "Owen", "Rosa", "Hugo", "Iris", "Milo", "Vera", "Axel",
  "Zara", "Cole", "Ines", "Luca", "Maeve", "Arlo", "Nina", "Felix", "Ada",
];

/** Your past hangout spending (cents per month), so the My spending chart isn't empty. Demo data. */
export const SPENDING_HISTORY: { month: string; cents: number; hangouts: number }[] = [
  { month: "2026-06", cents: 4200, hangouts: 2 },
  { month: "2026-07", cents: 7850, hangouts: 3 },
  { month: "2026-08", cents: 3100, hangouts: 1 },
  { month: "2026-09", cents: 6400, hangouts: 2 },
  { month: "2026-10", cents: 5520, hangouts: 2 },
];
