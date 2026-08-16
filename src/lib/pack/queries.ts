export const META_SQL = `SELECT key, value FROM meta`;

export const STATIONS_IN_BBOX_SQL = `
SELECT id, name, lat, lon, agency_id, wheelchair
FROM stops
WHERE is_station = 1
  AND lat BETWEEN ? AND ?
  AND lon BETWEEN ? AND ?
`;

export const STOP_ROUTES_SQL = `
SELECT stop_id, route_id
FROM stop_routes
WHERE stop_id IN (/*ids*/)
`;

export const STATION_BY_ID_SQL = `
SELECT id, name, lat, lon, agency_id, wheelchair, station_id
FROM stops
WHERE id = ? AND is_station = 1
`;

export const STATION_BY_PLATFORM_SQL = `
SELECT s.id, s.name, s.lat, s.lon, s.agency_id, s.wheelchair, s.station_id
FROM stops platform
JOIN stops s ON s.id = platform.station_id
WHERE platform.id = ? AND s.is_station = 1
`;

export const DEPARTURES_SQL = `
SELECT d.stop_id, d.trip_id, d.route_id, d.service_ymd, d.departure_sec,
       d.headsign, r.short_name, r.long_name, r.color, r.text_color,
       r.agency_id, r.mode
FROM departures d
JOIN routes r ON r.id = d.route_id
WHERE d.station_id = ?
  AND (
    (d.service_ymd = ? AND d.departure_sec >= ?)
    OR (d.service_ymd = ? AND d.departure_sec >= ?)
  )
ORDER BY d.service_ymd, d.departure_sec
LIMIT ?
`;
