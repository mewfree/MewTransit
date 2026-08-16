import type { AgencyId, Mode } from "./types";

export const DOWNTOWN: { lat: number; lon: number } = {
  lat: 45.508,
  lon: -73.568,
};

export function isNearMontreal(lat: number, lon: number): boolean {
  const dLat = lat - DOWNTOWN.lat;
  const dLon = lon - DOWNTOWN.lon;
  return dLat * dLat + dLon * dLon < 0.4;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "Now";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}

export function agencyLabel(agency: AgencyId): string {
  switch (agency) {
    case "stm":
      return "STM";
    case "rem":
      return "REM";
    case "exo":
      return "Exo";
  }
}

export function modeGlyph(mode: Mode): string {
  switch (mode) {
    case "metro":
      return "M";
    case "bus":
      return "B";
    case "train":
      return "T";
    case "rem":
      return "R";
  }
}

export function hexColor(color: string): string {
  return color.startsWith("#") ? color : `#${color}`;
}
