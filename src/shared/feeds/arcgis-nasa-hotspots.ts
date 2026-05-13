import "server-only";

import type {
  FireHotspot,
  GeospatialFeedId,
  GeospatialFeedIssue,
  GeospatialFeedPolicy,
} from "@/shared/geospatial/contracts";

const CHILE_FIRE_BBOX = [-74.8, -38.1, -70.6, -36.1] as const;
const FEED_ID: GeospatialFeedId = "arcgis-nasa-modis";

type ArcGisHotspotResponse = {
  features?: Array<{
    geometry?: { coordinates?: [number, number] };
    id?: number | string;
    properties?: {
      ACQ_DATE?: number;
      BRIGHTNESS?: number;
      CONFIDENCE?: number;
      FRP?: number;
      HOURS_OLD?: number;
      OBJECTID?: number | string;
    };
  }>;
};

export interface FireHotspotFeedResult {
  feedId: GeospatialFeedId;
  fetchedAt: string;
  hotspots: FireHotspot[];
  issues: GeospatialFeedIssue[];
}

const defaultFeedPolicy: GeospatialFeedPolicy = {
  timeoutMs: 4_000,
  staleAfterMs: 60_000,
  allowPartialResults: true,
};

function createIssue(
  code: GeospatialFeedIssue["code"],
  message: string,
  retryable: boolean,
): GeospatialFeedIssue {
  return {
    code,
    feedId: FEED_ID,
    message,
    retryable,
  };
}

function buildQuery() {
  const [xmin, ymin, xmax, ymax] = CHILE_FIRE_BBOX;

  return new URLSearchParams({
    where: "HOURS_OLD <= 48",
    geometry: `${xmin},${ymin},${xmax},${ymax}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "OBJECTID,BRIGHTNESS,FRP,CONFIDENCE,ACQ_DATE,HOURS_OLD",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cancel() {
      clearTimeout(timeoutId);
    },
  };
}

function normalizeResponse(data: ArcGisHotspotResponse): FireHotspot[] {
  return (data.features ?? []).flatMap((feature) => {
    const coordinates = feature.geometry?.coordinates;
    const properties = feature.properties;

    if (!coordinates || !properties) {
      return [];
    }

    const providerId = feature.id ?? properties.OBJECTID;

    return [
      {
        id: String(providerId ?? `${coordinates[1]}:${coordinates[0]}`),
        lat: coordinates[1],
        lon: coordinates[0],
        brightness: properties.BRIGHTNESS ?? 0,
        confidence: properties.CONFIDENCE ?? 0,
        frp: properties.FRP ?? 0,
        hoursOld: properties.HOURS_OLD ?? 0,
        acquiredAt: properties.ACQ_DATE
          ? new Date(properties.ACQ_DATE).toISOString()
          : "",
        source: FEED_ID,
      },
    ];
  });
}

export async function fetchArcGisNasaHotspots(
  policy: GeospatialFeedPolicy = defaultFeedPolicy,
): Promise<FireHotspotFeedResult> {
  const query = buildQuery();
  const requestUrl = `https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/MODIS_Thermal_v1/FeatureServer/0/query?${query.toString()}`;
  const fetchedAt = new Date().toISOString();
  const timeout = createTimeoutSignal(policy.timeoutMs);

  try {
    const response = await fetch(requestUrl, {
      signal: timeout.signal,
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        feedId: FEED_ID,
        fetchedAt,
        hotspots: [],
        issues: [
          createIssue(
            "upstream-error",
            `ArcGIS feed returned HTTP ${response.status}.`,
            response.status >= 500,
          ),
        ],
      };
    }

    const data = (await response.json()) as ArcGisHotspotResponse;

    if (!Array.isArray(data.features)) {
      return {
        feedId: FEED_ID,
        fetchedAt,
        hotspots: [],
        issues: [
          createIssue(
            "invalid-payload",
            "ArcGIS feed payload did not include a features array.",
            false,
          ),
        ],
      };
    }

    return {
      feedId: FEED_ID,
      fetchedAt,
      hotspots: normalizeResponse(data),
      issues: [],
    };
  } catch (error) {
    const issue = error instanceof DOMException && error.name === "AbortError"
      ? createIssue("timeout", `ArcGIS feed timed out after ${policy.timeoutMs}ms.`, true)
      : createIssue("network-error", "ArcGIS feed request failed.", true);

    return {
      feedId: FEED_ID,
      fetchedAt,
      hotspots: [],
      issues: [issue],
    };
  } finally {
    timeout.cancel();
  }
}

export { defaultFeedPolicy };
