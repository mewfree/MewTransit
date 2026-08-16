import { minutesUntil } from "./time";
import type { Departure } from "./types";

export type RtLookup = {
  asOf: string;
  byTripStop: Map<string, number>;
  delayByTrip: Map<string, number>;
};

export type RtSnapshotJson = {
  asOf: string | null;
  byTripStop?: Array<[string, number]>;
  delayByTrip?: Array<[string, number]>;
};

export function parseRtSnapshot(raw: RtSnapshotJson): RtLookup | null {
  if (!raw.asOf) return null;
  return {
    asOf: raw.asOf,
    byTripStop: new Map(raw.byTripStop ?? []),
    delayByTrip: new Map(raw.delayByTrip ?? []),
  };
}

export function applyRealtime(
  departures: Departure[],
  rt: RtLookup | null,
  now: Date,
): Departure[] {
  if (!rt) return departures;
  return departures
    .map((dep) => {
      if (dep.agency !== "stm" || !dep.tripId) return dep;
      const platformId = dep.stopId;
      const exact =
        platformId != null
          ? rt.byTripStop.get(`${dep.tripId}:${platformId}`)
          : undefined;
      if (exact != null) {
        const when = new Date(exact);
        return {
          ...dep,
          departureTime: when.toISOString(),
          minutes: minutesUntil(now, when),
          realtime: true,
        };
      }
      const delay = rt.delayByTrip.get(dep.tripId);
      if (delay == null) return dep;
      const when = new Date(new Date(dep.departureTime).getTime() + delay * 1000);
      return {
        ...dep,
        departureTime: when.toISOString(),
        minutes: minutesUntil(now, when),
        realtime: true,
      };
    })
    .sort(
      (a, b) =>
        a.minutes - b.minutes ||
        a.routeShortName.localeCompare(b.routeShortName),
    );
}
