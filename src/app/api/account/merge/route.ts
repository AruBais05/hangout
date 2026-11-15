import { sbAdmin } from "@/lib/supabase-admin";
import { userFrom } from "@/lib/server-auth";

/**
 * After a guest signs up or logs in: moves the rooms, memberships and expenses of their old
 * anonymous session to the account. Both sessions must be valid, and the old one must be anonymous.
 */
export async function POST(request: Request) {
  const admin = sbAdmin();
  if (!admin) return Response.json({ moved: false, reason: "not configured" });
  const next = await userFrom(request);
  let oldToken = "";
  try {
    oldToken = String((await request.json()).oldToken ?? "");
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const { data: prev } = await admin.auth.getUser(oldToken);
  const old = prev.user;
  if (!next || next.is_anonymous || !old || !old.is_anonymous || old.id === next.id) {
    return Response.json({ moved: false });
  }
  await admin.from("rooms").update({ host_id: next.id }).eq("host_id", old.id);
  // A person can be in a room once; if the account is already there, keep that row.
  const { data: rows } = await admin.from("members").select("id, room_id").eq("user_id", old.id);
  for (const r of rows ?? []) {
    const { data: dup } = await admin.from("members").select("id").eq("room_id", r.room_id).eq("user_id", next.id).maybeSingle();
    if (dup) await admin.from("members").delete().eq("id", r.id);
    else {
      await admin.from("members").update({ user_id: next.id }).eq("id", r.id);
      await admin.from("member_budgets").update({ user_id: next.id }).eq("member_id", r.id);
    }
  }
  await admin.from("expenses").update({ created_by: next.id }).eq("created_by", old.id);
  return Response.json({ moved: true });
}
