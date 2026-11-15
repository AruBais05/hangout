import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase is optional. With NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set,
// the app uses real accounts, shared rooms and live updates. Without them it stays browser-only.
// The anon key is public by design: Row Level Security in supabase/schema.sql protects the data.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const cloudOn = !!(URL && KEY);
export const googleOn = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

let client: SupabaseClient | null = null;

export function sb(): SupabaseClient | null {
  if (!cloudOn || typeof window === "undefined") return null;
  client ??= createClient(URL!, KEY!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "hangout-auth" },
  });
  return client;
}

/** Everyone gets a session: friends without an account get an anonymous one. Returns the user id. */
export async function ensureSession(): Promise<string | null> {
  const c = sb();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: anon, error } = await c.auth.signInAnonymously();
  if (error) {
    console.warn("[cloud] anonymous sign-in is off; staying browser-only:", error.message);
    return null;
  }
  return anon.user?.id ?? null;
}

export async function accessToken(): Promise<string | null> {
  const c = sb();
  if (!c) return null;
  return (await c.auth.getSession()).data.session?.access_token ?? null;
}
