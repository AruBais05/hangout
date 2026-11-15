import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  allowCall,
  aiKey,
  cacheGet,
  cacheSet,
  clientIp,
  complete,
  hashKey,
  loadPrompt,
  logSource,
  parseJson,
  RateLimited,
  withTimeout,
} from "@/lib/ai";
import { FIXED_QUIZ, PERSONALITIES, PURPOSES, TYPE_ORDER, type GroupQuiz, type Personality, type QuizQuestion } from "@/lib/config";
import { clean } from "@/lib/suggest";

export const maxDuration = 15;

const Body = z.object({
  purpose: z.enum(PURPOSES.map((p) => p.id) as [string, ...string[]]),
  vibe: z.enum(["active", "chill"]),
  city: z.string().min(1).max(200),
});

// Type names as the AI sees them ("Night owl") → our ids ("nightowl").
const BY_NAME = new Map<string, Personality>(TYPE_ORDER.map((t) => [PERSONALITIES[t].name.toLowerCase(), t]));

const words = (max: number) => z.string().min(1).refine((s) => s.trim().split(/\s+/).length <= max);

const AiQuiz = z.object({
  questions: z
    .array(
      z.object({
        text: words(12),
        answers: z
          .array(
            z.object({
              text: words(8),
              points: z
                .record(z.string(), z.union([z.literal(1), z.literal(2)]))
                .refine((p) => {
                  const keys = Object.keys(p);
                  return keys.length >= 1 && keys.length <= 2 && keys.every((k) => BY_NAME.has(k.toLowerCase()));
                }),
            }),
          )
          .min(3)
          .max(4),
      }),
    )
    .length(5),
});

export async function POST(request: NextRequest) {
  const started = Date.now();
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const city = clean(body.city, 40);
  const purpose = PURPOSES.find((p) => p.id === body.purpose)!;
  const key = hashKey(JSON.stringify(["quiz", purpose.id, body.vibe, city.toLowerCase()]));
  const fixed: GroupQuiz = { source: "fixed", questions: FIXED_QUIZ };

  const hit = cacheGet<GroupQuiz>(key);
  if (hit) {
    logSource("quiz", "cache", started);
    return Response.json(hit);
  }
  if (!aiKey() || !allowCall(clientIp(request.headers))) {
    logSource("quiz", "fixed", started);
    return Response.json(fixed);
  }

  try {
    const system = await loadPrompt("quiz");
    const data = {
      purpose: purpose.label,
      vibe: body.vibe,
      city,
      types: TYPE_ORDER.map((t) => PERSONALITIES[t].name),
    };
    const text = await withTimeout((signal) =>
      complete(system, `Write the quiz. JSON input:\n${JSON.stringify(data)}`, signal),
    );
    const quiz = AiQuiz.parse(parseJson(text));
    const questions: QuizQuestion[] = quiz.questions.map((q) => ({
      text: q.text.trim(),
      answers: q.answers.map((a) => ({
        text: a.text.trim(),
        points: Object.fromEntries(Object.entries(a.points).map(([k, v]) => [BY_NAME.get(k.toLowerCase())!, v])),
      })),
    }));
    const result: GroupQuiz = { source: "ai", questions };
    cacheSet(key, result);
    logSource("quiz", "ai", started);
    return Response.json(result);
  } catch (err) {
    logSource("quiz", err instanceof RateLimited ? "fixed(429)" : "fixed", started);
    return Response.json(fixed);
  }
}
