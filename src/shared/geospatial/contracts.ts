export type GeospatialFeedId = "arcgis-nasa-modis";

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
  confidence: number;
  frp: number;
  hoursOld: number;
  id: string;
  lat: number;
  lon: number;
  source: GeospatialFeedId;
}

export interface FireHotspotLayer {
  fetchedAt: string;
  hotspots: FireHotspot[];
  issues: GeospatialFeedIssue[];
  policy: GeospatialFeedPolicy;
  sourceFeeds: GeospatialFeedId[];
  status: GeospatialLayerStatus;
}

export interface GeospatialBootstrap {
  fireHotspots: FireHotspotLayer;
}
