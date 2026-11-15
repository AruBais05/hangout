import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { AI, type AiProvider } from "./config";

// One adapter for every provider. Keys are server-only env vars and are never logged.

const KEYS: Record<AiProvider, string> = {
  groq: "GROQ_API_KEY",
  gemini: "GEMINI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

const BASE_URLS: Partial<Record<AiProvider, string>> = {
  groq: "https://api.groq.com/openai/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
};

export class RateLimited extends Error {}

export function aiKey(): string | null {
  return process.env[KEYS[AI.provider]]?.trim() || null;
}

/** Sends one system + user message, returns the reply text. No retries: a 429 fails fast. */
export async function complete(system: string, user: string, signal: AbortSignal): Promise<string> {
  const key = aiKey();
  if (!key) throw new Error("no-key");
  const model = AI.models[AI.provider];

  if (AI.provider === "anthropic") {
    const client = new Anthropic({ apiKey: key, maxRetries: 0 });
    try {
      const res = await client.messages.create(
        {
          model,
          max_tokens: AI.maxTokens,
          output_config: { effort: "low" },
          system,
          messages: [{ role: "user", content: user }],
        },
        { signal },
      );
      if (res.stop_reason === "refusal") throw new Error("refusal");
      return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) throw new RateLimited();
      throw err;
    }
  }

  const client = new OpenAI({ apiKey: key, baseURL: BASE_URLS[AI.provider], maxRetries: 0 });
  try {
    const res = await client.chat.completions.create(
      {
        model,
        max_tokens: AI.maxTokens,
        temperature: AI.temperature,
        response_format: { type: "json_object" },
        // Only reasoning models (gpt-oss) take this; others would reject it.
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: AI.reasoningEffort } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { signal },
    );
    return res.choices[0]?.message?.content ?? "";
  } catch (err) {
    if (err instanceof OpenAI.RateLimitError) throw new RateLimited();
    throw err;
  }
}

/** Runs `fn` with an AbortController that fires after AI.timeoutMs. */
export async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI.timeoutMs);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

const prompts = new Map<string, string>();
export async function loadPrompt(name: "suggest" | "quiz"): Promise<string> {
  if (!prompts.has(name)) {
    prompts.set(name, await readFile(path.join(process.cwd(), "prompts", `${name}.txt`), "utf8"));
  }
  return prompts.get(name)!;
}

/** Strips ``` fences and parses JSON. Throws on bad JSON. */
export function parseJson(text: string): unknown {
  const body = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(body);
}

export function hashKey(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 32);
}

/* ---------- in-memory cache and per-IP limiter (reset when the server restarts) ---------- */

const cache = new Map<string, { at: number; value: unknown }>();

export function cacheGet<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit || Date.now() - hit.at > AI.cacheMs) return null;
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown) {
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), value });
}

const calls = new Map<string, number[]>();

/** True if this IP may make another AI call now (and counts it). */
export function allowCall(ip: string): boolean {
  const now = Date.now();
  const recent = (calls.get(ip) ?? []).filter((t) => now - t < AI.rateLimit.windowMs);
  if (recent.length >= AI.rateLimit.calls) {
    calls.set(ip, recent);
    return false;
  }
  recent.push(now);
  calls.set(ip, recent);
  return true;
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}

/** Logs only the route, where the answer came from, and how long it took. */
export function logSource(route: string, source: string, started: number) {
  console.info(`[${route}] source=${source} ms=${Date.now() - started}`);
}
