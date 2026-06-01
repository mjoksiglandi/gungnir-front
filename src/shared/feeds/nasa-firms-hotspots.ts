import "server-only";

import type {
  FireHotspot,
  GeospatialFeedId,
  GeospatialFeedIssue,
  GeospatialFeedPolicy,
} from "@/shared/geospatial/contracts";

type FireHotspotFeedResult = {
  feedId: GeospatialFeedId;
  fetchedAt: string;
  hotspots: FireHotspot[];
  issues: GeospatialFeedIssue[];
};

const FEEDS = [
  {
    feedId: "nasa-firms-viirs" as const,
    url: "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv",
  },
  {
    feedId: "nasa-firms-modis" as const,
    url: "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_24h.csv",
  },
];

export const defaultFeedPolicy: GeospatialFeedPolicy = {
  allowPartialResults: true,
  staleAfterMs: 300_000,
  timeoutMs: 15_000,
};

function createIssue(
  feedId: GeospatialFeedId,
  code: GeospatialFeedIssue["code"],
  message: string,
  retryable: boolean,
): GeospatialFeedIssue {
  return {
    code,
    feedId,
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

function parseConfidence(rawValue: string | undefined) {
  if (!rawValue) return "unknown";
  const normalized = rawValue.trim().toLowerCase();
  const numericValue = Number(normalized);

  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  return normalized;
}

function parseCsv(csv: string, feedId: typeof FEEDS[number]["feedId"]): FireHotspot[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",");
  const latIdx = header.indexOf("latitude");
  const lonIdx = header.indexOf("longitude");
  const brightnessIdx = header.indexOf("bright_ti4") !== -1
    ? header.indexOf("bright_ti4")
    : header.indexOf("brightness");
  const confidenceIdx = header.indexOf("confidence");
  const dateIdx = header.indexOf("acq_date");
  const timeIdx = header.indexOf("acq_time");
  const frpIdx = header.indexOf("frp");

  if ([latIdx, lonIdx, brightnessIdx, confidenceIdx, dateIdx, timeIdx, frpIdx].some((index) => index < 0)) {
    return [];
  }

  const maxPoints = 2_000;
  const step = lines.length > maxPoints ? Math.ceil(lines.length / maxPoints) : 1;
  const fetchedAt = Date.now();

  const hotspots: FireHotspot[] = [];
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += step) {
    const cols = lines[lineIndex]?.split(",");
    if (!cols) continue;

    const lat = Number(cols[latIdx]);
    const lon = Number(cols[lonIdx]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const date = cols[dateIdx] ?? "";
    const time = (cols[timeIdx] ?? "").padStart(4, "0");
    const acquiredAt = date
      ? new Date(`${date}T${time.slice(0, 2)}:${time.slice(2)}:00Z`).toISOString()
      : "";
    const hoursOld = acquiredAt
      ? Math.max(0, (fetchedAt - new Date(acquiredAt).getTime()) / 3_600_000)
      : 0;

    hotspots.push({
      acquiredAt,
      brightness: Number(cols[brightnessIdx]) || 0,
      confidence: parseConfidence(cols[confidenceIdx]),
      frp: Number(cols[frpIdx]) || 0,
      hoursOld,
      id: `${feedId}:${lineIndex}:${lat}:${lon}`,
      lat,
      lon,
      source: feedId,
    });
  }

  return hotspots;
}

async function fetchSingleFeed(
  feed: typeof FEEDS[number],
  policy: GeospatialFeedPolicy,
): Promise<FireHotspotFeedResult> {
  const fetchedAt = new Date().toISOString();
  const timeout = createTimeoutSignal(policy.timeoutMs);

  try {
    const response = await fetch(feed.url, {
      signal: timeout.signal,
      headers: {
        accept: "text/csv",
        "user-agent": "gugnir-console-front/0.1",
      },
    });

    if (!response.ok) {
      return {
        feedId: feed.feedId,
        fetchedAt,
        hotspots: [],
        issues: [
          createIssue(feed.feedId, "upstream-error", `NASA FIRMS returned HTTP ${response.status}.`, response.status >= 500),
        ],
      };
    }

    const csv = await response.text();
    const hotspots = parseCsv(csv, feed.feedId);

    if (hotspots.length === 0) {
      return {
        feedId: feed.feedId,
        fetchedAt,
        hotspots: [],
        issues: [
          createIssue(feed.feedId, "invalid-payload", "NASA FIRMS payload could not be parsed.", false),
        ],
      };
    }

    return {
      feedId: feed.feedId,
      fetchedAt,
      hotspots,
      issues: [],
    };
  } catch (error) {
    const issue = error instanceof DOMException && error.name === "AbortError"
      ? createIssue(feed.feedId, "timeout", `NASA FIRMS timed out after ${policy.timeoutMs}ms.`, true)
      : createIssue(feed.feedId, "network-error", "NASA FIRMS request failed.", true);

    return {
      feedId: feed.feedId,
      fetchedAt,
      hotspots: [],
      issues: [issue],
    };
  } finally {
    timeout.cancel();
  }
}

export async function fetchNasaFirmsHotspots(
  policy: GeospatialFeedPolicy = defaultFeedPolicy,
): Promise<FireHotspotFeedResult> {
  const results = await Promise.all(FEEDS.map((feed) => fetchSingleFeed(feed, policy)));
  const preferred = results.find((result) => result.hotspots.length > 0) ?? results[0];

  return preferred;
}
