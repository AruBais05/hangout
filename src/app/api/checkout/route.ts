import { connection, type NextRequest } from "next/server";
import { getStripe, lineItem, stripeKeyProblem, taxOn, type CheckoutItem, type PassPlan } from "@/lib/stripe";
import { userFrom } from "@/lib/server-auth";

/** Tells the checkout screen whether Stripe test mode is set up. */
export async function GET() {
  await connection();
  const problem = stripeKeyProblem();
  return Response.json({ enabled: !problem, problem });
}

/** Creates a Stripe Checkout Session and returns its hosted page URL. */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return Response.json({ error: "Stripe test mode is not set up." }, { status: 503 });

  let body: { item?: string; plan?: string; back?: string; roomId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const item: CheckoutItem = body.item === "pass" ? "pass" : "unlock";
  const plan: PassPlan = "yearly";
  const back = body.back === "/pass" ? "/pass" : "/room/unlock/pay";
  const origin = request.nextUrl.origin;
  // Supabase mode: who's paying and for which room, so the server can save it after Stripe confirms.
  const user = await userFrom(request);
  const roomId = typeof body.roomId === "string" && /^[0-9a-f-]{36}$/i.test(body.roomId) ? body.roomId : "";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: item === "pass" ? "subscription" : "payment",
      line_items: [lineItem(item, plan)],
      success_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${back}`,
      metadata: { item, plan, user_id: user?.id ?? "", room_id: item === "unlock" ? roomId : "" },
      ...(taxOn() ? { automatic_tax: { enabled: true }, billing_address_collection: "required" as const } : {}),
    });
    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.warn("[checkout] Stripe could not create the session:", message);
    return Response.json({ error: message }, { status: 502 });
  }
}
