import Icon from "@/components/Icon";
import { partnersFor } from "@/lib/config";
import type { PlanCard } from "@/lib/suggest";
import { mapsSearchUrl } from "@/lib/maps";
import styles from "./PlaceMap.module.css";

type Idea = Pick<PlanCard, "searchHint" | "bookingUrl" | "eventName" | "partnerName">;

/** Booking for the chosen plan: tickets for a real event, otherwise find & book it on Google Maps. */
export default function BookLinks({ idea, city }: { idea: Idea; city: string }) {
  const site = partnersFor(city).find((p) => p.name === idea.partnerName)?.bookingUrl;
  return (
    <div className={styles.links}>
      {idea.bookingUrl ? (
        <a className={styles.link} href={idea.bookingUrl} target="_blank" rel="noopener noreferrer">
          <Icon name="card" size={16} />
          Get tickets
          <span className="visually-hidden">for {idea.eventName} (opens in a new tab)</span>
        </a>
      ) : (
        <a className={styles.link} href={mapsSearchUrl({ searchHint: idea.searchHint, city })} target="_blank" rel="noopener noreferrer">
          <Icon name="pin" size={16} />
          Find &amp; book
          <span className="visually-hidden">on Google Maps (opens in a new tab)</span>
        </a>
      )}
      {site && (
        <a className={styles.link} href={site} target="_blank" rel="noopener noreferrer">
          <Icon name="calendar" size={16} />
          Venue website
          <span className="visually-hidden">for {idea.partnerName} (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}
