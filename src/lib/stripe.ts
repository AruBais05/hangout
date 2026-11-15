import "server-only";
import Stripe from "stripe";
import { PRICES } from "./config";

// Server-only Stripe helpers. Test mode only: live keys are refused.

let client: Stripe | null = null;

export function stripeKeyProblem(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return "no-key";
  if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) return "live-key";
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) return "bad-key";
  return null;
}

/** The Stripe client, or null when no usable test key is set. */
export function getStripe(): Stripe | null {
  if (stripeKeyProblem()) return null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  return client;
}

export const taxOn = () => process.env.STRIPE_AUTOMATIC_TAX === "true";

export type CheckoutItem = "unlock" | "pass";
export type PassPlan = "monthly" | "yearly";

/** What Stripe charges, built from the same config the screens use. */
export function lineItem(item: CheckoutItem, plan: PassPlan): Stripe.Checkout.SessionCreateParams.LineItem {
  if (item === "unlock") {
    return {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: PRICES.unlockCents,
        product_data: { name: "Big Plan unlock", description: "One-time unlock for one big plan" },
      },
    };
  }
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: plan === "yearly" ? PRICES.passYearlyCents : PRICES.passMonthlyCents,
      recurring: { interval: plan === "yearly" ? "year" : "month" },
      product_data: { name: `Crew Pass (${plan})`, description: "Unlimited big plans and full group history" },
    },
  };
}
