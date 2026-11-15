import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client with the service role key. Bypasses Row Level Security: use it only for
// what the browser must not do itself (saving Stripe-verified Crew Pass and Big Plan unlocks,
// and moving a guest's rooms to their new account). Never import this from client code.

let admin: SupabaseClient | null = null;

export function sbAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  admin ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
