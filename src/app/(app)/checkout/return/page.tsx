"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import styles from "@/components/demo/Checkout.module.css";
import { formatCents } from "@/lib/money";
import { activatePass } from "@/lib/auth";
import { update, useDemo } from "@/lib/store";

type Result =
  | { status: "checking" }
  | { status: "paid"; item: "unlock" | "pass"; amountCents: number | null; taxCents: number }
  | { status: "failed"; message: string };

async function verify(): Promise<Result> {
  const id = new URLSearchParams(window.location.search).get("session_id");
  if (!id) return { status: "failed", message: "This link has no payment on it." };
  const res = await fetch(`/api/checkout/session?id=${encodeURIComponent(id)}`);
  const d = await res.json();
  if (!res.ok) return { status: "failed", message: d.error ?? "Stripe couldn't confirm the payment." };
  if (!d.paid) return { status: "failed", message: "The payment didn't go through. Nothing was charged." };
  if (d.item === "pass") activatePass();
  else update({ unlocked: true });
  return { status: "paid", item: d.item, amountCents: d.amountCents, taxCents: d.taxCents };
}

export default function CheckoutReturn() {
  const router = useRouter();
  const [state] = useDemo();
  const [result, setResult] = useState<Result>({ status: "checking" });

  useEffect(() => {
    let alive = true;
    verify()
      .catch(() => ({ status: "failed", message: "Couldn't reach the server." }) as Result)
      .then((r) => alive && setResult(r));
    return () => {
      alive = false;
    };
  }, []);

  if (result.status === "checking") {
    return (
      <div className={s.screen}>
        <p className={s.lede} role="status">
          <span className={s.spinner} aria-hidden="true" /> Checking your payment with Stripe…
        </p>
      </div>
    );
  }

  if (result.status === "failed") {
    return (
      <div className={s.screen}>
        <h1 className={s.title}>Payment not finished</h1>
        <p className={s.lede}>{result.message}</p>
        <div className={s.actions}>
          <Link href="/plans" className={s.primary}>
            Back to plans
          </Link>
        </div>
      </div>
    );
  }

  const unlock = result.item === "unlock";
  const next = unlock ? "/room/ideas" : (state.returnTo ?? "/room/recap");
  return (
    <div className={s.screen}>
      <div className={styles.success} role="status">
        <span className={styles.tick} aria-hidden="true">
          <Icon name="check" size={36} />
        </span>
        <h1 className={s.title}>{unlock ? "Plan unlocked" : "Crew Pass is on"}</h1>
        <p className={s.lede}>
          {unlock
            ? "Budget match, who's in and weekend dates are on for this plan."
            : "5 vote options, unlimited big plans, cost split, your spending and full history."}
        </p>
        {result.amountCents != null && (
          <p className={s.small}>
            Paid {formatCents(result.amountCents)} in Stripe test mode
            {result.taxCents > 0 ? `, including ${formatCents(result.taxCents)} tax` : ""}. No real money moved.
          </p>
        )}
      </div>
      <div className={s.actions}>
        <button type="button" className={s.primary} onClick={() => router.push(next)}>
          Continue
        </button>
      </div>
    </div>
  );
}
