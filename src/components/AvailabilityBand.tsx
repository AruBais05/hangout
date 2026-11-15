import { CREW, CREW_AVAILABILITY, DAYS, SLOTS, type SlotKey } from "@/lib/config";
import styles from "./AvailabilityBand.module.css";

const YOU: SlotKey[] = ["Thu-Afternoon", "Fri-Late", "Sat-Evening", "Sat-Late", "Sun-Evening"];
const MATCH: SlotKey = "Sat-Evening";

const rows = [
  ...CREW.map((m) => ({ name: m.name, free: CREW_AVAILABILITY[m.id] })),
  { name: "You", free: YOU },
];

const columns = DAYS.flatMap((d) => SLOTS.map((s) => `${d}-${s}` as SlotKey));

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
