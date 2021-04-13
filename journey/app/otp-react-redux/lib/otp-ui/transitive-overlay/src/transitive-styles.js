import {
  isBikeshareStation,
  isCarWalkTransition,
  isEScooterStation
} from "../../core-utils/src/map";

const STYLES = {};

/**
 * Transitive style overrides for places (basically any point that isn't a
 * transit stop)
 *
 * This style rule draws nothing except when a bikeshare station or e-scooter
 * station is encountered.
 *
 * The from/to locations are drawn outside of transitive and there are separate
 * renderers for transit stops.
 */
STYLES.places = {
  display: (display, place) =>
    isBikeshareStation(place) ||
    isEScooterStation(place) ||
    isCarWalkTransition(place)
      ? true
      : "none",
  fill: (display, place) => {
    if (isBikeshareStation(place)) {
      return "#f00";
    }
    if (isCarWalkTransition(place)) {
      return "#888";
    }
    if (isEScooterStation(place)) {
      return "#f5a729";
    }
    return null;
  },
  stroke: "#fff",
  "stroke-width": 2,
  r: 7
};

/**
 * Transitive style overrides for transit stops. All this does is sets the
 * radius to 6 pixels.
 */
STYLES.stops_merged = {
  r() {
    return 6;
  }
};

export default STYLES;
