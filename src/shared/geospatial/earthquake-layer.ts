import "server-only";

import type {
  EarthquakeEvent,
  EarthquakeLayer,
  GeospatialFeedIssue,
  GeospatialFeedPolicy,
} from "@/shared/geospatial/contracts";

const FEED_ID = "usgs-earthquakes" as const;
const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

const defaultFeedPolicy: GeospatialFeedPolicy = {
  allowPartialResults: true,
  staleAfterMs: 60_000,
  timeoutMs: 10_000,
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

type UsgsResponse = {
  features?: Array<{
    geometry?: {
      coordinates?: [number, number, number];
    };
    id?: string;
    properties?: {
      alert?: string | null;
      felt?: number | null;
      mag?: number | null;
      place?: string;
      time?: number;
      tsunami?: number;
      url?: string;
    };
  }>;
};

function normalizeResponse(data: UsgsResponse): EarthquakeEvent[] {
  return (data.features ?? []).flatMap((feature) => {
    const coordinates = feature.geometry?.coordinates;
    const properties = feature.properties;

    if (!coordinates || !properties || typeof properties.mag !== "number" || typeof properties.time !== "number") {
      return [];
    }

    return [
      {
        alert: properties.alert ?? null,
        depthKm: coordinates[2] ?? 0,
        feltReports: properties.felt ?? null,
        id: feature.id ?? `${coordinates[1]}:${coordinates[0]}:${properties.time}`,
        lat: coordinates[1],
        lon: coordinates[0],
        magnitude: properties.mag,
        occurredAt: new Date(properties.time).toISOString(),
        place: properties.place ?? "Unknown location",
        source: FEED_ID,
        tsunami: properties.tsunami === 1,
        url: properties.url ?? "",
      },
    ];
  });
}

export async function loadEarthquakeLayer(
  policy: GeospatialFeedPolicy = defaultFeedPolicy,
): Promise<EarthquakeLayer> {
  const fetchedAt = new Date().toISOString();
  const timeout = createTimeoutSignal(policy.timeoutMs);

  try {
    const response = await fetch(USGS_URL, {
      signal: timeout.signal,
      headers: {
        accept: "application/geo+json, application/json",
      },
    });

    if (!response.ok) {
      return {
        events: [],
        fetchedAt,
        issues: [
          createIssue("upstream-error", `USGS returned HTTP ${response.status}.`, response.status >= 500),
        ],
        policy,
        sourceFeeds: [FEED_ID],
        status: "unavailable",
      };
    }

    const data = (await response.json()) as UsgsResponse;
    const events = normalizeResponse(data);

    if (events.length === 0) {
      return {
        events: [],
        fetchedAt,
        issues: [
          createIssue("invalid-payload", "USGS payload did not include usable earthquake features.", false),
        ],
        policy,
        sourceFeeds: [FEED_ID],
        status: "unavailable",
      };
    }

    return {
      events,
      fetchedAt,
      issues: [],
      policy,
      sourceFeeds: [FEED_ID],
      status: "ready",
    };
  } catch (error) {
    const issue = error instanceof DOMException && error.name === "AbortError"
      ? createIssue("timeout", `USGS timed out after ${policy.timeoutMs}ms.`, true)
      : createIssue("network-error", "USGS request failed.", true);

    return {
      events: [],
      fetchedAt,
      issues: [issue],
      policy,
      sourceFeeds: [FEED_ID],
      status: "unavailable",
    };
  } finally {
    timeout.cancel();
  }
}
