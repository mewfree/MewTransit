import { AgencyColor } from "@/constants/theme";
import type { NearbyStop } from "@/lib/types";

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  color: string;
};

export type MapToHost =
  | { type: "ready" }
  | { type: "select"; id: string }
  | { type: "move"; lat: number; lon: number };

export type HostToMap =
  | { type: "center"; lat: number; lon: number; force?: boolean }
  | { type: "stops"; stops: MapPin[] }
  | { type: "user"; show: boolean; lat?: number; lon?: number };

export function stopPins(stops: NearbyStop[]): MapPin[] {
  return stops.map((stop) => ({
    id: stop.id,
    name: stop.name,
    lat: stop.lat,
    lon: stop.lon,
    color: AgencyColor[stop.agency] ?? "#111318",
  }));
}

export function parseMapMessage(raw: unknown): MapToHost | null {
  let data = raw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object") return null;
  const msg = data as { type?: unknown };
  if (msg.type === "ready" || msg.type === "select" || msg.type === "move") {
    return data as MapToHost;
  }
  return null;
}

export function buildMapHtml({
  lat,
  lon,
  dark,
}: {
  lat: number;
  lon: number;
  dark: boolean;
}): string {
  const style = dark
    ? "https://tiles.openfreemap.org/styles/dark"
    : "https://tiles.openfreemap.org/styles/liberty";
  const bg = dark ? "#111318" : "#F4F5F8";
  const tipBg = dark ? "#1B1D24" : "#fff";
  const tipFg = dark ? "#F4F5F8" : "#111318";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    html, body, #map { height: 100%; margin: 0; background: ${bg}; }
    .stop-tip .maplibregl-popup-content {
      background: ${tipBg};
      color: ${tipFg};
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
      font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 4px 8px;
    }
    .stop-tip .maplibregl-popup-tip { display: none; }
    .user-dot, .stop-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.35);
      cursor: pointer;
    }
    .user-dot {
      width: 18px;
      height: 18px;
      background: #1A73E8;
      border-width: 3px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
  <script>
    function notify(payload) {
      var text = JSON.stringify(payload);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(text);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(text, "*");
      }
    }

    if (typeof maplibregl === "undefined") {
      document.body.innerHTML =
        '<p style="font-family:-apple-system,sans-serif;padding:24px;color:${tipFg}">Map failed to load. Check your connection.</p>';
      throw new Error("maplibre missing");
    }

    var map = new maplibregl.Map({
      container: "map",
      style: ${JSON.stringify(style)},
      center: [${lon}, ${lat}],
      zoom: 14,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();

    var stopMarkers = [];
    var userMarker = null;
    var programmatic = false;
    var ready = false;
    var queued = [];

    function samePoint(aLat, aLon, bLat, bLon) {
      return Math.abs(aLat - bLat) < 1e-5 && Math.abs(aLon - bLon) < 1e-5;
    }

    function apply(msg) {
      if (!msg || typeof msg !== "object") return;
      if (!map.loaded()) {
        queued.push(msg);
        return;
      }
      if (msg.type === "center" && typeof msg.lat === "number") {
        var here = map.getCenter();
        if (!msg.force && samePoint(here.lat, here.lng, msg.lat, msg.lon)) return;
        programmatic = true;
        map.easeTo({ center: [msg.lon, msg.lat] });
        map.once("moveend", function () { programmatic = false; });
      }
      if (msg.type === "stops" && Array.isArray(msg.stops)) {
        stopMarkers.forEach(function (m) { m.remove(); });
        stopMarkers = msg.stops.map(function (stop) {
          var el = document.createElement("div");
          el.className = "stop-dot";
          el.style.background = stop.color;
          el.title = stop.name;
          el.addEventListener("click", function () {
            notify({ type: "select", id: stop.id });
          });
          return new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat([stop.lon, stop.lat])
            .setPopup(
              new maplibregl.Popup({
                closeButton: false,
                offset: 12,
                className: "stop-tip",
              }).setText(stop.name),
            )
            .addTo(map);
        });
      }
      if (msg.type === "user") {
        if (userMarker) {
          userMarker.remove();
          userMarker = null;
        }
        if (msg.show && typeof msg.lat === "number") {
          var dot = document.createElement("div");
          dot.className = "user-dot";
          userMarker = new maplibregl.Marker({ element: dot, anchor: "center" })
            .setLngLat([msg.lon, msg.lat])
            .addTo(map);
        }
      }
    }

    window.addEventListener("message", function (event) {
      var data = event.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (e) { return; }
      }
      apply(data);
    });

    window.__mew = { apply: apply };

    map.on("load", function () {
      queued.forEach(apply);
      queued = [];
      notify({ type: "ready" });
      setTimeout(function () { ready = true; }, 250);
    });

    map.on("moveend", function () {
      if (!ready || programmatic) return;
      var c = map.getCenter();
      notify({ type: "move", lat: c.lat, lon: c.lng });
    });
  </script>
</body>
</html>`;
}
