import type { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";

/** Checks a finished Checkout Session on the server, so the page can't fake "paid". */
export async function GET(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return Response.json({ error: "Stripe test mode is not set up." }, { status: 503 });

  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!/^cs_test_[A-Za-z0-9]+$/.test(id)) return Response.json({ error: "Bad session id." }, { status: 400 });

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    return Response.json({
      paid: session.payment_status === "paid" || session.payment_status === "no_payment_required",
      item: session.metadata?.item === "pass" ? "pass" : "unlock",
      plan: session.metadata?.plan === "monthly" ? "monthly" : "yearly",
      amountCents: session.amount_total,
      taxCents: session.total_details?.amount_tax ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return Response.json({ error: message }, { status: 502 });
  }
}
