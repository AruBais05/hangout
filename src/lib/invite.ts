import { z } from "zod";
import { PEOPLE, PURPOSES, TYPE_ORDER, type GroupQuiz, type PurposeId, type QuizQuestion } from "./config";
import type { Meeting } from "./store";

// The invite link carries the group itself (no backend): purpose, dates, size, city, vibe,
// host's first name and the group's quiz, as base64url JSON in ?g=. Treated as untrusted input.

export type Invite = { meeting: Meeting; host: string; quiz: GroupQuiz | null };

const Points = z
  .partialRecord(z.enum(TYPE_ORDER as [string, ...string[]]), z.union([z.literal(1), z.literal(2)]))
  .refine((p) => { const n = Object.keys(p).length; return n >= 1 && n <= 2; });
const Schema = z.object({
  v: z.literal(1),
  p: z.enum(PURPOSES.map((p) => p.id) as [string, ...string[]]),
  f: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  t: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  n: z.number().int().min(PEOPLE.min).max(PEOPLE.max),
  c: z.string().min(1).max(40),
  ce: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
  vb: z.enum(["active", "chill"]),
  nm: z.string().max(40),
  h: z.string().max(20),
  q: z
    .array(z.object({ t: z.string().min(1).max(120), a: z.array(z.object({ t: z.string().min(1).max(80), p: Points })).min(3).max(4) }))
    .length(5)
    .optional(),
});

const toB64url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

export function encodeInvite(m: Meeting, host: string, quiz: GroupQuiz | null): string {
  const data: z.infer<typeof Schema> = {
    v: 1,
    p: m.purpose,
    f: m.from,
    t: m.to,
    n: m.people,
    c: m.city.slice(0, 40),
    ce: m.center,
    vb: m.vibe,
    nm: m.name.slice(0, 40),
    h: host.slice(0, 20),
    // Only an AI-written quiz needs to travel; the fixed and demo quizzes are built in.
    ...(quiz?.source === "ai"
      ? { q: quiz.questions.map((x) => ({ t: x.text, a: x.answers.map((a) => ({ t: a.text, p: a.points as Record<string, 1 | 2> })) })) }
      : {}),
  };
  return toB64url(JSON.stringify(data));
}

export function decodeInvite(g: string | null): Invite | null {
  if (!g || g.length > 8000) return null;
  try {
    const d = Schema.parse(JSON.parse(fromB64url(g)));
    const quiz: GroupQuiz | null = d.q
      ? {
          source: "ai",
          questions: d.q.map((x): QuizQuestion => ({
            text: x.t,
            answers: x.a.map((a) => ({ text: a.t, points: a.p as QuizQuestion["answers"][number]["points"] })),
          })),
        }
      : null;
    return {
      meeting: { purpose: d.p as PurposeId, from: d.f, to: d.t, people: d.n, city: d.c, center: d.ce, vibe: d.vb, name: d.nm },
      host: d.h,
      quiz,
    };
  } catch {
    return null;
  }
}

export function inviteUrl(origin: string, m: Meeting, host: string, quiz: GroupQuiz | null): string {
  return `${origin}/join?g=${encodeInvite(m, host, quiz)}`;
}
