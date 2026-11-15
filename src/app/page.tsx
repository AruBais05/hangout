import Link from "next/link";
import Logo from "@/components/Logo";
import AvailabilityBand from "@/components/AvailabilityBand";
import { BIG_PLAN, PLAN_FEATURES, PRICES } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import styles from "./page.module.css";

const steps = [
  {
    title: "Everyone adds their free time",
    body: "Each friend taps when they're free and picks a budget only they can see. No calendar sign-in needed.",
    tone: "purple",
  },
  {
    title: "Hangout suggests three plans",
    body: "We find the time that works for everyone and three ideas inside the group's budget, each with a short reason why.",
    tone: "lilac",
  },
  {
    title: "The group votes and says who's in",
    body: "Everyone picks a favorite. For big plans, a yes-or-no deadline shows who's really coming before anyone books.",
    tone: "deep",
  },
  {
    title: "Book it, split it, go",
    body: "You book the venue directly. Hangout splits the cost and sends each friend a link to pay you back.",
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
              plan. Everyone adds their free time and a private budget, the group votes, and
              Hangout splits the cost. Everyday hangouts are free.
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
              Everyday hangouts are free.
            </h2>
            <p className={styles.pricingLede}>
              Coffee, dinner, a movie night: always free. You pay only to unlock a big plan, like a
              weekend away or a birthday for ten.
            </p>
          </div>

          <div className={styles.plans}>
            <article className={styles.plan} aria-labelledby="plan-free">
              <h3 id="plan-free" className={styles.planName}>
                Everyday
              </h3>
              <p className={styles.price}>
                <span className={styles.amount}>$0</span>
              </p>
              <p className={styles.priceNote}>Nobody pays, ever</p>
              <ul className={styles.features}>
                {PLAN_FEATURES.everyday.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </article>

            <article className={`${styles.plan} ${styles.planPass}`} aria-labelledby="plan-unlock">
              <h3 id="plan-unlock" className={styles.planName}>
                Big Plan unlock
              </h3>
              <p className={styles.price}>
                <span className={styles.amount}>{formatPrice(PRICES.unlockCents)}</span>
                <span className={styles.per}>once per plan</span>
              </p>
              <p className={styles.priceNote}>
                The organizer pays. It goes into the split, so friends pay them back about $1 each.
              </p>
              <ul className={styles.features}>
                {PLAN_FEATURES.unlock.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link href="/demo" className={styles.passButton}>
                Try a big plan in the demo
              </Link>
            </article>

            <article className={styles.plan} aria-labelledby="plan-pass">
              <h3 id="plan-pass" className={styles.planName}>
                Crew Pass
              </h3>
              <p className={styles.price}>
                <span className={styles.amount}>{formatPrice(PRICES.passYearlyCents)}</span>
                <span className={styles.per}>a year</span>
              </p>
              <p className={styles.priceNote}>
                or {formatPrice(PRICES.passMonthlyCents)} a month, for groups that plan big often
              </p>
              <ul className={styles.features}>
                {PLAN_FEATURES.pass.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className={styles.promises}>
            <p>
              <strong>If your plan doesn&rsquo;t happen,</strong> the unlock carries over to your
              next one.
            </p>
            <p>
              <strong>A big plan</strong> is more than one day, {BIG_PLAN.minPeople} or more
              people, or over {formatPrice(BIG_PLAN.budgetOverCents)} a person.
            </p>
            <p>
              <strong>We never hold your money.</strong> You pay venues directly. Partner stays and
              tickets pay us a small commission, never you.
            </p>
          </div>
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
