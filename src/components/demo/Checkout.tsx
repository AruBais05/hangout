"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { DEMO_CARD, PRICES } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { activatePass } from "@/lib/auth";
import { accessToken } from "@/lib/supabase";
import { update, useDemo, type PassPlan } from "@/lib/store";
import s from "./screen.module.css";
import styles from "./Checkout.module.css";

type Fields = { number: string; expiry: string; cvc: string; zip: string };
type Errors = Partial<Record<keyof Fields, string>>;

function validate(f: Fields): Errors {
  const e: Errors = {};
  const digits = f.number.replace(/\s/g, "");
  if (!/^\d{16}$/.test(digits)) e.number = "Enter all 16 digits of the card number.";
  else if (digits !== DEMO_CARD.replace(/\s/g, "")) e.number = `This demo takes only the demo card, ${DEMO_CARD}.`;
  const m = f.expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) e.expiry = "Enter the date as MM/YY.";
  else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    const now = new Date();
    const thisMonth = now.getFullYear() * 12 + now.getMonth() + 1;
    if (month < 1 || month > 12) e.expiry = "The month must be 01 to 12.";
    else if (year * 12 + month < thisMonth) e.expiry = "Use a date in the future.";
  }
  if (!/^\d{3,4}$/.test(f.cvc)) e.cvc = "Enter the 3 or 4 digits on the back.";
  if (!/^\d{5}$/.test(f.zip)) e.zip = "Enter a 5-digit ZIP code.";
  return e;
}

function formatNumber(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export default function Checkout({ item }: { item: "unlock" | "pass" }) {
  const router = useRouter();
  const [state] = useDemo();
  const plan: PassPlan = "yearly"; // Crew Pass is yearly only
  const [f, setF] = useState<Fields>({ number: "", expiry: "", cvc: "", zip: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  // "stripe" when a Stripe test key is set on the server, "demo" otherwise.
  const [mode, setMode] = useState<"checking" | "stripe" | "demo">("checking");
  const [stripeError, setStripeError] = useState("");
  useEffect(() => {
    let alive = true;
    fetch("/api/checkout")
      .then((r) => r.json())
      .then((d) => alive && setMode(d.enabled ? "stripe" : "demo"))
      .catch(() => alive && setMode("demo"));
    return () => {
      alive = false;
    };
  }, []);
  const refs = {
    number: useRef<HTMLInputElement>(null),
    expiry: useRef<HTMLInputElement>(null),
    cvc: useRef<HTMLInputElement>(null),
    zip: useRef<HTMLInputElement>(null),
  };

  const priceCents = item === "unlock" ? PRICES.unlockCents : PRICES.passYearlyCents;
  const title = item === "unlock" ? "Unlock this big plan" : "Get Crew Pass";
  const next = item === "unlock" ? "/room/ideas" : (state.returnTo ?? "/room/recap");

  function fillDemo() {
    setF({ number: DEMO_CARD, expiry: "12/30", cvc: "123", zip: "10001" });
    setErrors({});
  }

  async function payWithStripe() {
    setPaying(true);
    setStripeError("");
    try {
      const token = await accessToken();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ item, plan, back: item === "pass" ? "/pass" : "/room/unlock/pay", roomId: state.room?.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Stripe didn't answer.");
      window.location.assign(data.url);
    } catch (err) {
      setPaying(false);
      setStripeError(err instanceof Error ? err.message : "Stripe didn't answer.");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "stripe") {
      payWithStripe();
      return;
    }
    if (mode !== "demo") return;
    const errs = validate(f);
    setErrors(errs);
    const first = (Object.keys(refs) as (keyof Fields)[]).find((k) => errs[k]);
    if (first) {
      refs[first].current?.focus();
      return;
    }
    setPaying(true);
    // Mock payment: nothing leaves the browser.
    setTimeout(() => {
      if (item === "unlock") update({ unlocked: true });
      else activatePass();
      setPaying(false);
      setDone(true);
    }, 1200);
  }

  if (done) {
    return (
      <div className={s.screen}>
        <div className={styles.success} role="status">
          <span className={styles.tick} aria-hidden="true">
            <Icon name="check" size={36} />
          </span>
          <h1 className={s.title}>{item === "unlock" ? "Plan unlocked" : "Crew Pass is on"}</h1>
          <p className={s.lede}>
            {item === "unlock"
              ? "Budget match, who's in and weekend dates are on for this plan."
              : "5 vote options, unlimited big plans, cost split, your spending and full history."}
          </p>
        </div>
        <div className={s.actions}>
          <button type="button" className={s.primary} onClick={() => router.push(next)}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  const field = (
    name: keyof Fields,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    fmt?: (v: string) => string,
  ) => (
    <div className={styles.field}>
      <label htmlFor={`cc-${name}`}>{label}</label>
      <input
        id={`cc-${name}`}
        ref={refs[name]}
        value={f[name]}
        onChange={(e) => setF({ ...f, [name]: fmt ? fmt(e.target.value) : e.target.value })}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `cc-${name}-err` : undefined}
        {...props}
      />
      {errors[name] && (
        <p id={`cc-${name}-err`} className={styles.error}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form className={s.screen} onSubmit={submit} noValidate>
      <div>
        <h1 className={s.title}>{title}</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          {item === "unlock"
            ? "One payment for this big plan, paid by the organizer."
            : "5 vote options, unlimited big plans, cost split and your spending. Cancel any time."}
        </p>
      </div>

      {item === "pass" && (
        <p className={styles.switch} style={{ padding: "14px 16px" }}>
          <span>
            Yearly <strong>{formatPrice(PRICES.passYearlyCents)}</strong>
          </span>
        </p>
      )}

      {mode === "stripe" && (
        <div className={styles.demoCard}>
          <p>
            <strong>Stripe test card:</strong> {DEMO_CARD}, any future date, any CVC, any ZIP. You&rsquo;ll type
            it on Stripe&rsquo;s secure page next.
          </p>
          {stripeError && (
            <p className={styles.error} role="alert">
              {stripeError}{" "}
              <button type="button" className={s.textLink} onClick={() => setMode("demo")}>
                Use the demo form instead
              </button>
            </p>
          )}
        </div>
      )}

      {mode === "demo" && (
      <div className={styles.demoCard}>
        <p>
          <strong>Demo card:</strong> {DEMO_CARD}, any future date, any CVC, any ZIP
        </p>
        <button type="button" className={s.textLink} onClick={fillDemo}>
          Fill it in for me
        </button>
      </div>
      )}

      {mode === "demo" && (
      <div className={styles.fields}>
        {field(
          "number",
          "Card number",
          { inputMode: "numeric", autoComplete: "cc-number", placeholder: "1234 1234 1234 1234" },
          formatNumber,
        )}
        <div className={styles.split}>
          {field(
            "expiry",
            "Expiry",
            { inputMode: "numeric", autoComplete: "cc-exp", placeholder: "MM/YY" },
            formatExpiry,
          )}
          {field(
            "cvc",
            "CVC",
            { inputMode: "numeric", autoComplete: "cc-csc", maxLength: 4, placeholder: "123" },
            (v) => v.replace(/\D/g, ""),
          )}
        </div>
        {field(
          "zip",
          "ZIP code",
          { inputMode: "numeric", autoComplete: "postal-code", maxLength: 5, placeholder: "10001" },
          (v) => v.replace(/\D/g, ""),
        )}
      </div>
      )}

      <div className={s.actions}>
        <button type="submit" className={s.primary} disabled={paying || mode === "checking"}>
          {paying ? (
            <>
              <span className={s.spinner} aria-hidden="true" />
              {mode === "stripe" ? "Opening Stripe…" : "Paying…"}
            </>
          ) : mode === "stripe" ? (
            `Pay ${formatPrice(priceCents)} with Stripe`
          ) : (
            `Pay ${formatPrice(priceCents)}`
          )}
        </button>
        <p className={s.small}>
          {mode === "stripe" ? "Stripe test mode. No real charge." : "Demo checkout. No real charge."}
        </p>
      </div>
    </form>
  );
}
