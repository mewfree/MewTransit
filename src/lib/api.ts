import { Platform } from "react-native";

import { isPackOpen, openActivePack } from "./pack/db";
import { packNearby, packStopDepartures } from "./pack/nearby";
import { applyRealtime, parseRtSnapshot, type RtLookup } from "./realtime";
import type { NearbyResponse, StopDeparturesResponse } from "./types";

const DEFAULT_API = "https://mewtransit-api.dgonot.workers.dev";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API
).replace(/\/$/, "");

async function getJson<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${url}: ${body.slice(0, 180)}`);
  }
  return (await res.json()) as T;
}

async function fetchStmRt(timeoutMs = 1500): Promise<RtLookup | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}/v1/rt/stm`, { signal: ac.signal });
    if (!res.ok) return null;
    return parseRtSnapshot(await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function overlayRealtime<
  T extends { departures: NearbyResponse["stops"][number]["departures"] },
>(data: T, now = new Date()): Promise<T> {
  const rt = await fetchStmRt();
  if (!rt) return data;
  return { ...data, departures: applyRealtime(data.departures, rt, now) };
}

export async function overlayRealtimeNearby(
  data: NearbyResponse,
  now = new Date(),
): Promise<NearbyResponse> {
  const rt = await fetchStmRt();
  if (!rt) return data;
  return {
    ...data,
    asOf: rt.asOf,
    stops: data.stops.map((stop) => ({
      ...stop,
      departures: applyRealtime(stop.departures, rt, now),
    })),
  };
}

/** Native timetable is the city pack only. Web still uses the Worker. */
export async function fetchNearby(
  lat: number,
  lon: number,
): Promise<NearbyResponse> {
  if (Platform.OS === "web") {
    const q = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      radius_m: "1500",
      limit: "16",
      departures: "3",
    });
    return getJson<NearbyResponse>(`/v1/nearby?${q.toString()}`);
  }

  if (!isPackOpen()) await openActivePack();
  const local = isPackOpen()
    ? await packNearby({
        lat,
        lon,
        radiusM: 1500,
        limit: 16,
        departures: 3,
      })
    : null;
  if (!local) {
    throw new Error("pack not open");
  }
  return local;
}

export async function fetchStopDepartures(
  id: string,
): Promise<StopDeparturesResponse> {
  if (Platform.OS === "web") {
    return getJson<StopDeparturesResponse>(
      `/v1/stops/${encodeURIComponent(id)}/departures?limit=24`,
    );
  }

  if (!isPackOpen()) await openActivePack();
  if (!isPackOpen()) throw new Error("pack not open");
  const local = await packStopDepartures(id, 24);
  if (!local) throw new Error("stop not found");
  return overlayRealtime(local);
}
