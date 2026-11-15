import "server-only";
import { sbAdmin } from "./supabase-admin";

/** The signed-in Supabase user behind a request's "Authorization: Bearer <token>", or null. */
export async function userFrom(request: Request) {
  const admin = sbAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!admin || !token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}
