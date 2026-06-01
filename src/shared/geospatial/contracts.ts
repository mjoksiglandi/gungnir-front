export type GeospatialFeedId =
  | "arcgis-nasa-modis"
  | "nasa-firms-viirs"
  | "nasa-firms-modis"
  | "usgs-earthquakes";

export type GeospatialLayerStatus = "ready" | "degraded" | "unavailable";

export interface GeospatialFeedPolicy {
  allowPartialResults: boolean;
  staleAfterMs: number;
  timeoutMs: number;
}

export interface GeospatialFeedIssue {
  code: "invalid-payload" | "network-error" | "timeout" | "upstream-error";
  feedId: GeospatialFeedId;
  message: string;
  retryable: boolean;
}

export interface FireHotspot {
  acquiredAt: string;
  brightness: number;
  confidence: number | string;
  frp: number;
  hoursOld: number;
  id: string;
  lat: number;
  lon: number;
  source: Exclude<GeospatialFeedId, "usgs-earthquakes">;
}

export interface FireHotspotLayer {
  fetchedAt: string;
  hotspots: FireHotspot[];
  issues: GeospatialFeedIssue[];
  policy: GeospatialFeedPolicy;
  sourceFeeds: GeospatialFeedId[];
  status: GeospatialLayerStatus;
}

export interface EarthquakeEvent {
  alert: string | null;
  depthKm: number;
  feltReports: number | null;
  id: string;
  lat: number;
  lon: number;
  magnitude: number;
  occurredAt: string;
  place: string;
  source: "usgs-earthquakes";
  tsunami: boolean;
  url: string;
}

export interface EarthquakeLayer {
  events: EarthquakeEvent[];
  fetchedAt: string;
  issues: GeospatialFeedIssue[];
  policy: GeospatialFeedPolicy;
  sourceFeeds: GeospatialFeedId[];
  status: GeospatialLayerStatus;
}

export interface GeospatialBootstrap {
  fireHotspots: FireHotspotLayer;
  earthquakes?: EarthquakeLayer;
}
