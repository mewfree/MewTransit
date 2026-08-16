import type { AgencyId, NearbyResponse, NearbyStop, StopDeparturesResponse } from "../types";
import { getPackDb, getPackMeta, packSource } from "./db";
import { packDeparturesForStation } from "./departures";
import {
  STATION_BY_ID_SQL,
  STATION_BY_PLATFORM_SQL,
  STATIONS_IN_BBOX_SQL,
  STOP_ROUTES_SQL,
} from "./queries";

const EARTH_M = 6_371_000;

type StationRow = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  agency_id: AgencyId;
  wheelchair: number;
  station_id?: string;
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

function isMajorStop(stop: { agency: AgencyId; id: string }): boolean {
  return stop.agency === "rem" || stop.agency === "exo" || stop.id.includes(":STATION_");
}

export function pickNearby<T extends { id: string; agency: AgencyId; distanceM: number }>(
  candidates: T[],
  limit: number,
): T[] {
  const sorted = [...candidates].sort((a, b) => a.distanceM - b.distanceM);
  const major = sorted.filter(isMajorStop).slice(0, Math.min(10, limit));
  const majorIds = new Set(major.map((s) => s.id));
  const fill = sorted.filter((s) => !majorIds.has(s.id));
  const busSlots = Math.max(0, limit - major.length);
  return [...major, ...fill.slice(0, busSlots)].sort((a, b) => a.distanceM - b.distanceM);
}

async function routesByStopIds(
  stopIds: string[],
): Promise<Map<string, string[]>> {
  const db = getPackDb();
  const map = new Map<string, string[]>();
  if (!db || stopIds.length === 0) return map;
  const chunkSize = 80;
  for (let i = 0; i < stopIds.length; i += chunkSize) {
    const chunk = stopIds.slice(i, i + chunkSize);
    const ph = chunk.map(() => "?").join(",");
    const sql = STOP_ROUTES_SQL.replace("/*ids*/", ph);
    const rows = await db.getAllAsync<{ stop_id: string; route_id: string }>(sql, chunk);
    for (const row of rows) {
      const list = map.get(row.stop_id) ?? [];
      list.push(row.route_id);
      map.set(row.stop_id, list);
    }
  }
  return map;
}

export async function packNearby(opts: {
  lat: number;
  lon: number;
  radiusM?: number;
  limit?: number;
  departures?: number;
}): Promise<NearbyResponse | null> {
  const db = getPackDb();
  const packMeta = getPackMeta();
  if (!db || !packMeta) return null;

  const radiusM = opts.radiusM ?? 1500;
  const limit = opts.limit ?? 16;
  const departureLimit = opts.departures ?? 3;
  const pad = radiusM + 250;
  const dLat = pad / 111_320;
  const cos = Math.cos((opts.lat * Math.PI) / 180);
  const dLon = pad / (111_320 * Math.max(0.2, Math.abs(cos)));

  const rows = await db.getAllAsync<StationRow>(STATIONS_IN_BBOX_SQL, [
    opts.lat - dLat,
    opts.lat + dLat,
    opts.lon - dLon,
    opts.lon + dLon,
  ]);

  const candidates = rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      lat: row.lat,
      lon: row.lon,
      agency: row.agency_id,
      routeIds: [] as string[],
      wheelchair: row.wheelchair === 1,
      distanceM: Math.round(haversineM(opts.lat, opts.lon, row.lat, row.lon)),
    }))
    .filter((s) => s.distanceM <= radiusM);

  const picked = pickNearby(candidates, limit);
  const routeMap = await routesByStopIds(picked.map((s) => s.id));
  const stops: NearbyStop[] = [];
  for (const stop of picked) {
    const departures = await packDeparturesForStation(stop.id, departureLimit);
    stops.push({
      ...stop,
      routeIds: routeMap.get(stop.id) ?? [],
      departures,
    });
  }

  return {
    source: packSource() ?? `pack:${packMeta.civilDate}`,
    asOf: packMeta.builtAt || new Date().toISOString(),
    origin: { lat: opts.lat, lon: opts.lon },
    radiusM,
    stops,
  };
}

export async function packStopDepartures(
  id: string,
  limit = 24,
): Promise<StopDeparturesResponse | null> {
  const db = getPackDb();
  const packMeta = getPackMeta();
  if (!db || !packMeta) return null;

  const direct = await db.getFirstAsync<StationRow>(STATION_BY_ID_SQL, id);
  const row =
    direct ?? (await db.getFirstAsync<StationRow>(STATION_BY_PLATFORM_SQL, id));
  if (!row) return null;

  const routeMap = await routesByStopIds([row.id]);
  const departures = await packDeparturesForStation(row.id, limit);
  return {
    source: packSource() ?? `pack:${packMeta.civilDate}`,
    asOf: packMeta.builtAt || new Date().toISOString(),
    stop: {
      id: row.id,
      name: row.name,
      lat: row.lat,
      lon: row.lon,
      agency: row.agency_id,
      routeIds: routeMap.get(row.id) ?? [],
      wheelchair: row.wheelchair === 1,
    },
    departures,
  };
}
