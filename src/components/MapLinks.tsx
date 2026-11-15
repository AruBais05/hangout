import Icon from "@/components/Icon";
import { directionsUrl, mapsSearchUrl, type MapTarget } from "@/lib/maps";
import styles from "./PlaceMap.module.css";

/** "Open in Google Maps" (and optionally "Directions") for one plan. Plain links, no key needed. */
export default function MapLinks({ target, directions = true }: { target: MapTarget; directions?: boolean }) {
  return (
    <div className={styles.links}>
      <a className={styles.link} href={mapsSearchUrl(target)} target="_blank" rel="noopener noreferrer">
        <Icon name="pin" size={16} />
        Open in Google Maps
        <span className="visually-hidden">(opens in a new tab)</span>
      </a>
      {directions && (
        <a className={styles.link} href={directionsUrl(target)} target="_blank" rel="noopener noreferrer">
          Directions
          <span className="visually-hidden">to {target.searchHint} (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}
