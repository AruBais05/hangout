import styles from "./AvailabilityBand.module.css";

// An everyday week: four days, three time slots each. Saturday evening is the shared slot.
const DAYS = ["Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["Afternoon", "Evening", "Late"];
const MATCH = "Sat-Evening";

const rows = [
  { name: "Maya", free: ["Fri-Evening", "Sat-Afternoon", "Sat-Evening", "Sun-Afternoon"] },
  { name: "Jordan", free: ["Thu-Evening", "Sat-Afternoon", "Sat-Evening", "Sat-Late"] },
  { name: "Priya", free: ["Fri-Evening", "Sat-Evening", "Sun-Afternoon", "Sun-Evening"] },
  { name: "Leo", free: ["Fri-Evening", "Fri-Late", "Sat-Evening", "Sun-Afternoon"] },
  { name: "You", free: ["Thu-Afternoon", "Fri-Late", "Sat-Evening", "Sat-Late", "Sun-Evening"] },
];

const columns = DAYS.flatMap((d) => SLOTS.map((s) => `${d}-${s}`));

/**
 * The hero's signature moment: five friends' free time fills in,
 * then the one slot everyone shares lights up.
 */
export default function AvailabilityBand() {
  return (
    <figure className={styles.band} aria-labelledby="band-caption">
      <div className={styles.grid} style={{ "--cols": columns.length } as React.CSSProperties}>
        <span aria-hidden="true" />
        {DAYS.map((d) => (
          <span key={d} className={styles.day} aria-hidden="true">
            {d}
          </span>
        ))}
        {rows.map((row, r) => (
          <div key={row.name} className={styles.row} role="presentation">
            <span className={styles.name}>{row.name}</span>
            {columns.map((c, i) => {
              const free = row.free.includes(c);
              const match = c === MATCH;
              return (
                <span
                  key={c}
                  className={`${styles.cell} ${free ? styles.free : ""} ${match ? styles.match : ""}`}
                  style={{ "--d": `${(r * 3 + i) * 28}ms` } as React.CSSProperties}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        ))}
      </div>
      <figcaption id="band-caption" className={styles.caption}>
        <span className={styles.pin}>Sat 7:30 PM</span>
        <span>is the one time all five of you are free.</span>
      </figcaption>
    </figure>
  );
}
