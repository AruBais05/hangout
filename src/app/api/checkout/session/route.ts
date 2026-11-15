import type { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sbAdmin } from "@/lib/supabase-admin";

/** Checks a finished Checkout Session on the server, so the page can't fake "paid". */
export async function GET(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return Response.json({ error: "Stripe test mode is not set up." }, { status: 503 });

  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!/^cs_test_[A-Za-z0-9]+$/.test(id)) return Response.json({ error: "Bad session id." }, { status: 400 });

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    // Supabase mode: save what was paid for. Only here, after Stripe confirms, can these flags change.
    const admin = sbAdmin();
    const meta = session.metadata ?? {};
    if (paid && admin) {
      if (meta.item === "pass" && meta.user_id) {
        await admin.from("profiles").upsert({ id: meta.user_id, crew_pass: true, crew_pass_since: new Date().toISOString() });
      }
      if (meta.item === "unlock" && meta.room_id) {
        // Only the room's host can unlock it.
        await admin.from("rooms").update({ unlocked: true }).eq("id", meta.room_id).eq("host_id", meta.user_id);
      }
    }
    return Response.json({
      paid,
      item: session.metadata?.item === "pass" ? "pass" : "unlock",
      plan: "yearly",
      amountCents: session.amount_total,
      taxCents: session.total_details?.amount_tax ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return Response.json({ error: message }, { status: 502 });
  }
}
