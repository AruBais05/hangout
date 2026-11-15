import Link from "next/link";
import Logo from "@/components/Logo";
import AvailabilityBand from "@/components/AvailabilityBand";
import { LIMITS, PLAN_FEATURES, PRICES } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import styles from "./page.module.css";

const steps = [
  {
    title: "Everyone adds their free time",
    body: "Each friend taps the days and times they're free, plus a budget and whether they feel active or chill. No calendar sign-in needed.",
    tone: "purple",
  },
  {
    title: "Hangout suggests three plans",
    body: "We find the time that works for everyone and pick three ideas that fit the group's budget, each with a short reason why.",
    tone: "lilac",
  },
  {
    title: "The group votes",
    body: "Everyone picks a favorite. When the timer runs out, or someone ends the vote, the winner is locked in.",
    tone: "deep",
  },
  {
    title: "Pay your share, then go",
    body: "Each person pays only their part. You get a calendar invite, check in on the night, and see a recap after.",
    tone: "white",
  },
] as const;

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <Logo />
        <nav aria-label="Main" className={styles.nav}>
          <a href="#how" className={styles.navSquare}>
            How it works
          </a>
          <a href="#pricing" className={styles.navCircle}>
            Pricing
          </a>
        </nav>
      </header>

      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <h1 id="hero-title" className={styles.headline}>
            <span>We</span>{" "}
            <span className={styles.struck} aria-hidden="true">
              should
            </span>{" "}
            <span className={styles.are}>are</span>{" "}
            <span>hanging</span> <span>out.</span>
          </h1>
          <div className={styles.heroAside}>
            <p className={styles.lede}>
              Hangout turns the group chat&rsquo;s &ldquo;we should hang out&rdquo; into a booked
              plan. Everyone adds their free time and budget, the group votes, and we book the
              winner.
            </p>
            <Link href="/demo" className={styles.demoButton}>
              Try with a demo crew
            </Link>
            <p className={styles.note}>No sign-up. Takes about three minutes.</p>
          </div>
        </section>

        <AvailabilityBand />

        <section id="how" className={styles.how} aria-labelledby="how-title">
          <h2 id="how-title" className={styles.sectionTitle}>
            How it works
          </h2>
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={s.title} className={`${styles.step} ${styles[s.tone]}`}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="pricing" className={styles.pricing} aria-labelledby="pricing-title">
          <div className={styles.pricingHead}>
            <h2 id="pricing-title" className={styles.sectionTitle}>
              Planning is free.
            </h2>
            <p className={styles.pricingLede}>
              Groups, voting and check-ins never cost anything. You only pay when we book a venue
              for you.
            </p>
          </div>

          <div className={styles.plans}>
            <article className={styles.plan} aria-labelledby="plan-free">
              <h3 id="plan-free" className={styles.planName}>
                Free
              </h3>
              <p className={styles.price}>
                <span className={styles.amount}>$0</span>
              </p>
              <p className={styles.priceNote}>For every group, forever</p>
              <ul className={styles.features}>
                {PLAN_FEATURES.free.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </article>

            <article className={styles.plan} aria-labelledby="plan-per">
              <h3 id="plan-per" className={styles.planName}>
                Pay per hangout
              </h3>
              <p className={styles.price}>
                <span className={styles.amount}>{formatPrice(PRICES.bookingFeeCents)}</span>
                <span className={styles.per}>booking fee</span>
              </p>
              <p className={styles.priceNote}>Per person, on each booked hangout</p>
              <ul className={styles.features}>
                {PLAN_FEATURES.perHangout.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </article>

            <article className={`${styles.plan} ${styles.planPass}`} aria-labelledby="plan-pass">
              <h3 id="plan-pass" className={styles.planName}>
                Hangout Pass
              </h3>
              <p className={styles.price}>
                <span className={styles.amount}>{formatPrice(PRICES.passMonthlyCents)}</span>
                <span className={styles.per}>a month</span>
              </p>
              <p className={styles.priceNote}>
                or {formatPrice(PRICES.passYearlyCents)} a year. One person buys it.
              </p>
              <ul className={styles.features}>
                {PLAN_FEATURES.pass.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link href="/demo/pass" className={styles.passButton}>
                Get Hangout Pass – {formatPrice(PRICES.passMonthlyCents)}/month
              </Link>
            </article>
          </div>
          <p className={styles.fine}>
            With the Pass, the {formatPrice(PRICES.bookingFeeCents)} fee is waived on{" "}
            {LIMITS.feeFreeBookingsPerMonth} bookings a month. Friends without the Pass still pay
            their own fee.
          </p>
        </section>

        <section className={styles.closer} aria-labelledby="closer-title">
          <h2 id="closer-title" className={styles.closerTitle}>
            See you Saturday.
          </h2>
          <Link href="/demo" className={styles.closerButton}>
            Try with a demo crew
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <Logo tone="white" />
        <p>Made in New York. © 2026 Hangout.</p>
      </footer>
    </>
  );
}
