import type { AgencyId, Departure, Mode } from "../types";
import { gtfsDepartureUtc, minutesUntil, montrealParts, shiftYmd } from "../time";
import { getPackDb } from "./db";
import { DEPARTURES_SQL } from "./queries";

type DepartureRow = {
  stop_id: string;
  trip_id: string;
  route_id: string;
  service_ymd: number;
  departure_sec: number;
  headsign: string;
  short_name: string;
  long_name: string;
  color: string;
  text_color: string;
  agency_id: AgencyId;
  mode: Mode;
};

export async function packDeparturesForStation(
  stationId: string,
  limit: number,
  at = new Date(),
): Promise<Departure[]> {
  const db = getPackDb();
  if (!db) return [];
  const now = montrealParts(at);
  const yesterdayYmd = shiftYmd(now.ymd, -1);
  const rows = await db.getAllAsync<DepartureRow>(DEPARTURES_SQL, [
    stationId,
    now.ymd,
    now.daySec,
    yesterdayYmd,
    86_400 + now.daySec,
    limit,
  ]);
  return rows.map((row) => {
    const when = gtfsDepartureUtc(row.service_ymd, row.departure_sec, at);
    return {
      id: `${row.trip_id}:${stationId}:${row.departure_sec}`,
      tripId: row.trip_id,
      stopId: row.stop_id,
      routeId: row.route_id,
      routeShortName: row.short_name,
      routeLongName: row.long_name,
      routeColor: row.color || "888888",
      routeTextColor: row.text_color || "FFFFFF",
      agency: row.agency_id,
      mode: row.mode,
      headsign: row.headsign || row.long_name,
      departureTime: when.toISOString(),
      minutes: minutesUntil(at, when),
      realtime: false,
    };
  });
}
