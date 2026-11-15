import Link from "next/link";
import AvailabilityBand from "@/components/AvailabilityBand";
import { BIG_PLAN, PLAN_FEATURES, PRICES } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import styles from "./page.module.css";

const steps = [
  {
    title: "Set it up",
    body: "Pick what it's for, a date range and how many people. Ten seconds.",
  },
  {
    title: "Invite your crew",
    body: "Share one link. Each friend taps when they're free and takes a 1-minute personality quiz.",
  },
  {
    title: "Get three ideas, then vote",
    body: "Hangout finds the time that works and three ideas that fit everyone's budget and vibe.",
  },
  {
    title: "Lock it",
    body: "Everyday plans are free. For big plans, Hangout checks who's really in and splits the cost.",
  },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className={styles.heroWrap}>
        <header className={styles.header}>
          <Link href="/" className="wordmark">
            hangout
          </Link>
          <nav aria-label="Main" className={styles.nav}>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
          </nav>
        </header>

        <main id="main">
          <section className={styles.hero} aria-labelledby="hero-title">
            <h1 id="hero-title" className={styles.headline}>
              We{" "}
              <span className={styles.struck} aria-hidden="true">
                should
              </span>{" "}
              are hanging out.
            </h1>
            <div className={styles.heroAside}>
              <p className={styles.lede}>
                Turn the group chat&rsquo;s &ldquo;we should hang out&rdquo; into a plan. Set it up, share one
                link, and Hangout finds the time and the idea everyone&rsquo;s up for.
              </p>
              <Link href="/start" className={styles.cta}>
                Start a hangout
              </Link>
              <p className={styles.note}>No sign-up. No friends handy? Tap &ldquo;Try with a demo crew&rdquo; in the waiting room.</p>
            </div>
          </section>
        </main>
      </div>

      <AvailabilityBand />

      <section id="how" className={styles.section} aria-labelledby="how-title">
        <h2 id="how-title" className={styles.sectionTitle}>
          How it works
        </h2>
        <ol className={styles.steps}>
          {steps.map((s, i) => (
            <li key={s.title} className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className={styles.section} aria-labelledby="pricing-title">
        <div className={styles.pricingHead}>
          <h2 id="pricing-title" className={styles.sectionTitle}>
            Everyday hangouts are free.
          </h2>
          <p className={styles.sectionLede}>
            Coffee, dinner, a movie night: always free. You pay only to unlock a big plan, like a weekend away or a
            birthday for ten.
          </p>
        </div>

        <div className={styles.plans}>
          <article className={styles.plan} aria-labelledby="plan-free">
            <h3 id="plan-free" className={styles.planName}>
              Everyday
            </h3>
            <p className={styles.price}>$0</p>
            <p className={styles.priceNote}>Nobody pays, ever</p>
            <ul className={styles.features}>
              {PLAN_FEATURES.everyday.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>

          <article className={`${styles.plan} ${styles.planHot}`} aria-labelledby="plan-unlock">
            <h3 id="plan-unlock" className={styles.planName}>
              Big Plan unlock
            </h3>
            <p className={styles.price}>
              {formatPrice(PRICES.unlockCents)} <span className={styles.per}>once per plan</span>
            </p>
            <p className={styles.priceNote}>The organizer pays. It goes into the split: about $1 each.</p>
            <ul className={styles.features}>
              {PLAN_FEATURES.unlock.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>

          <article className={styles.plan} aria-labelledby="plan-pass">
            <h3 id="plan-pass" className={styles.planName}>
              Crew Pass
            </h3>
            <p className={styles.price}>
              {formatPrice(PRICES.passYearlyCents)} <span className={styles.per}>a year</span>
            </p>
            <p className={styles.priceNote}>or {formatPrice(PRICES.passMonthlyCents)} a month, for groups that plan big often</p>
            <ul className={styles.features}>
              {PLAN_FEATURES.pass.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className={styles.promises}>
          <p>
            <strong>A big plan</strong> is more than one day, {BIG_PLAN.minPeople}+ people, or over{" "}
            {formatPrice(BIG_PLAN.budgetOverCents)} a person.
          </p>
          <p>
            <strong>If it doesn&rsquo;t happen,</strong> the unlock carries over to your next plan.
          </p>
          <p>
            <strong>We never hold your money.</strong> You pay venues directly. Partners pay us a small
            commission, never you.
          </p>
        </div>
      </section>

      <section className={styles.closer} aria-labelledby="closer-title">
        <h2 id="closer-title" className={styles.closerTitle}>
          See you Saturday.
        </h2>
        <Link href="/start" className={styles.cta}>
          Start a hangout
        </Link>
      </section>

      <footer className={styles.footer}>
        <span className="wordmark">hangout</span>
        <p>Made in New York. © 2026 Hangout.</p>
      </footer>
    </>
  );
}
