export type AgencyId = "stm" | "rem" | "exo";
export type Mode = "metro" | "bus" | "train" | "rem";

export type Departure = {
  id: string;
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor: string;
  routeTextColor: string;
  agency: AgencyId;
  mode: Mode;
  headsign: string;
  departureTime: string;
  minutes: number;
  realtime: boolean;
};

export type NearbyStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  agency: AgencyId;
  routeIds: string[];
  wheelchair: boolean;
  distanceM: number;
  departures: Departure[];
};

export type NearbyResponse = {
  source: string;
  asOf: string;
  origin: { lat: number; lon: number };
  radiusM: number;
  stops: NearbyStop[];
};

export type StopDeparturesResponse = {
  source: string;
  asOf: string;
  stop: Omit<NearbyStop, "distanceM" | "departures">;
  departures: Departure[];
};

export type Coords = {
  lat: number;
  lon: number;
};
