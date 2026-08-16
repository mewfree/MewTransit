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

export function fetchNearby(lat: number, lon: number): Promise<NearbyResponse> {
  const q = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radius_m: "1500",
    limit: "16",
    departures: "3",
  });
  return getJson<NearbyResponse>(`/v1/nearby?${q.toString()}`);
}

export function fetchStopDepartures(
  id: string,
): Promise<StopDeparturesResponse> {
  return getJson<StopDeparturesResponse>(
    `/v1/stops/${encodeURIComponent(id)}/departures?limit=24`,
  );
}
