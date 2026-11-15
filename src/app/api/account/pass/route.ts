import { sbAdmin } from "@/lib/supabase-admin";
import { userFrom } from "@/lib/server-auth";

/** Cancel Crew Pass for the signed-in account (only the server may change it). */
export async function POST(request: Request) {
  const admin = sbAdmin();
  const user = await userFrom(request);
  if (!admin || !user || user.is_anonymous) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { error } = await admin.from("profiles").update({ crew_pass: false, crew_pass_since: null }).eq("id", user.id);
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
}
