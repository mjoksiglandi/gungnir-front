import type { Alert, Asset } from "@/shared/contracts/operational";
import { formatPercent, formatSpeedKph, formatTime } from "@/shared/lib/format";
import type { Device, TelemetryRecord } from "@/types/domain";

type QuickMetric = {
  label: string;
  value: string;
  secondary?: string;
};

type QuickReference = {
  heading: string;
  label: string;
  direction: string;
};

type QuickVideoFeed = {
  label: string;
  state: string;
  url: string;
};

type QuickAction = {
  label: string;
  tone?: "warning";
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function asString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function readNestedValue(sources: Array<Record<string, unknown>>, paths: string[]) {
  for (const source of sources) {
    for (const path of paths) {
      const value = source[path];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }

  return undefined;
}

function formatCompactNumber(value: number, digits = 1) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  const rounded = Number(value.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits);
}

function formatTemperature(value: number | null) {
  return value === null ? "n/a" : `${formatCompactNumber(value, 1)}°C`;
}

function formatSlope(value: number | null) {
  return value === null ? "n/a" : `${formatCompactNumber(value, 1)}°`;
}

function formatDistanceKm(value: number | null) {
  return value === null ? "n/a" : `${formatCompactNumber(value, 1)} km`;
}

function formatElevation(value: number | null) {
  return value === null ? "n/a" : `${Math.round(value)} m`;
}

function formatVerticalSpeed(value: number | null) {
  return value === null ? "n/a" : `${formatCompactNumber(value, 1)} m/s`;
}

function formatPace(value: number | null) {
  return value === null ? "n/a" : `${formatCompactNumber(value, 1)} km/h`;
}

function formatPower(value: number | null) {
  return value === null ? "n/a" : `${formatCompactNumber(value, 0)}%`;
}

function formatUptime(value: unknown) {
  const text = asString(value);
  if (text) {
    return text;
  }

  const seconds = asNumber(value);
  if (seconds === null) {
    return "n/a";
  }

  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

function formatRelativeAge(timestamp: string | null) {
  if (!timestamp) {
    return "UNKNOWN";
  }

  const deltaSeconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));

  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;
  if (deltaSeconds < 3600) return `${Math.round(deltaSeconds / 60)}m ago`;
  if (deltaSeconds < 86400) return `${Math.round(deltaSeconds / 3600)}h ago`;
  return `${Math.round(deltaSeconds / 86400)}d ago`;
}

function deriveLinkState(device: Device | null, telemetry: TelemetryRecord | null) {
  const quality = telemetry?.signalQuality ?? null;
  const status = device?.status ?? "offline";

  if (status === "online") return quality === null ? "ONLINE" : "ONLINE";
  if (status === "degraded") return "LIMITED";
  if (status === "retired") return "RETIRED";
  if (telemetry?.timestamp) return "LIVE";
  return "OFFLINE";
}

function buildDataSources(device: Device | null, telemetry: TelemetryRecord | null) {
  return [
    asRecord(device?.metadata) ?? {},
    asRecord(telemetry?.rawPayload) ?? {},
  ];
}

export function getQuickMetrics(asset: Asset, telemetry: TelemetryRecord | null, device: Device | null): QuickMetric[] {
  const sources = buildDataSources(device, telemetry);
  const slope = asNumber(readNestedValue(sources, ["slopeDeg", "slope", "terrainSlopeDeg"]));
  const terrain = asString(readNestedValue(sources, ["terrain", "terrainType", "surface"]));
  const temperature = asNumber(readNestedValue(sources, ["tempC", "temperatureC", "temperature"]));
  const uptime = readNestedValue(sources, ["uptime", "uptimeSec", "uptimeSeconds"]);
  const power = asNumber(readNestedValue(sources, ["powerPct", "batteryPct", "power"]));
  const pace = telemetry?.position.speedMps == null ? null : telemetry.position.speedMps * 3.6;

  if (asset.assetType === "air") {
    return [
      { label: "SPD", value: formatSpeedKph(asset.position.speedMps) },
      { label: "ALT", value: formatElevation(asset.position.altM ?? null) },
      { label: "VS", value: formatVerticalSpeed(telemetry?.verticalSpeedMs ?? null) },
      { label: "BAT", value: formatPercent(telemetry?.batteryPct ?? asset.batteryPct) },
    ];
  }

  if (asset.assetType === "ground" || asset.assetType === "autonomous") {
    return [
      { label: "SPD", value: formatSpeedKph(asset.position.speedMps) },
      { label: terrain ? "TERRAIN" : "SLOPE", value: terrain ?? formatSlope(slope) },
      { label: "BAT", value: formatPercent(telemetry?.batteryPct ?? asset.batteryPct) },
    ];
  }

  if (asset.assetType === "personnel") {
    return [
      { label: "PACE", value: formatPace(pace) },
      { label: "ELEV", value: formatElevation(asset.position.altM ?? null) },
      { label: "BAT", value: formatPercent(telemetry?.batteryPct ?? asset.batteryPct) },
    ];
  }

  return [
    { label: "POWER", value: formatPower(power ?? telemetry?.batteryPct ?? asset.batteryPct ?? null) },
    { label: "TEMP", value: formatTemperature(temperature) },
    { label: "UPTIME", value: formatUptime(uptime) },
  ];
}

export function getQuickReference(asset: Asset, telemetry: TelemetryRecord | null, device: Device | null): QuickReference | null {
  const sources = buildDataSources(device, telemetry);
  const reference = asRecord(readNestedValue(sources, ["reference", "referencePoint", "home", "base", "objective"]));

  const fallbackHeading = asset.assetType === "air"
    ? "BASE"
    : asset.assetType === "ground" || asset.assetType === "autonomous"
      ? "OBJECTIVE"
      : asset.assetType === "personnel"
        ? "RALLY POINT"
        : "SITE";

  if (!reference) {
    return null;
  }

  const label = asString(reference.label) ?? asString(reference.name) ?? fallbackHeading;
  const distance = asNumber(reference.distanceKm) ?? asNumber(reference.distance);
  const bearing = asNumber(reference.bearingDeg) ?? asNumber(reference.bearing);
  const direction = bearing === null ? "UNKNOWN" : `${bearing.toFixed(0)}°`;

  return {
    heading: "REFERENCE",
    label: `${label} ${formatDistanceKm(distance)}`.trim(),
    direction,
  };
}

export function getQuickVideoFeeds(asset: Asset, telemetry: TelemetryRecord | null, device: Device | null): QuickVideoFeed[] {
  const sources = buildDataSources(device, telemetry);
  const feedsValue = readNestedValue(sources, ["videoFeeds", "video_feeds", "feeds"]);

  if (!Array.isArray(feedsValue)) {
    const primaryId = device?.externalId ?? device?.id ?? asset.callsign.toLowerCase();
    const fallbackFeeds: QuickVideoFeed[] = [
      {
        label: "Primary Feed",
        state: "OFFLINE",
        url: `rtsp://${primaryId}/primary`,
      },
    ];

    if (asset.assetType === "air" || asset.assetType === "ground" || asset.assetType === "autonomous") {
      fallbackFeeds.push({
        label: "Secondary Feed",
        state: "OFFLINE",
        url: `rtsp://${primaryId}/secondary`,
      });
    }

    return fallbackFeeds;
  }

  return feedsValue
    .map((feed, index) => {
      const record = asRecord(feed);
      if (!record) {
        return null;
      }

      const label = asString(record.label) ?? (index === 0 ? "Primary Feed" : "Secondary Feed");
      const url = asString(record.url) ?? asString(record.rtspUrl) ?? `rtsp://feed-${index + 1}/live`;
      const connected = asBoolean(record.connected);
      const state = asString(record.state) ?? (connected === false ? "OFFLINE" : "CONNECTED");

      return { label, state: state.toUpperCase(), url };
    })
    .filter((feed): feed is QuickVideoFeed => Boolean(feed))
    .slice(0, 2);
}

export function getQuickActions(asset: Asset): QuickAction[] {
  if (asset.assetType === "air") {
    return [
      { label: "CENTER ON MAP" },
      { label: "FOLLOW" },
      { label: "SHOW ROUTE" },
      { label: "SEND COMMAND" },
      { label: "RETURN TO BASE", tone: "warning" },
      { label: "OPEN DETAILS" },
    ];
  }

  if (asset.assetType === "ground" || asset.assetType === "autonomous") {
    return [
      { label: "CENTER ON MAP" },
      { label: "FOLLOW" },
      { label: "SHOW ROUTE" },
      { label: "SEND COMMAND" },
      { label: "STOP", tone: "warning" },
      { label: "OPEN DETAILS" },
    ];
  }

  if (asset.assetType === "personnel") {
    return [
      { label: "CENTER ON MAP" },
      { label: "FOLLOW" },
      { label: "MESSAGE" },
      { label: "PING" },
      { label: "SHOW ROUTE" },
      { label: "OPEN DETAILS" },
    ];
  }

  return [
    { label: "CENTER ON MAP" },
    { label: "QUERY" },
    { label: "RESTART", tone: "warning" },
    { label: "OPEN DETAILS" },
  ];
}

export function getQuickUpdate(asset: Asset, telemetry: TelemetryRecord | null) {
  const timestamp = telemetry?.timestamp ?? asset.updatedAt;
  const battery = telemetry?.batteryPct ?? asset.batteryPct;

  return {
    time: formatTime(timestamp),
    age: formatRelativeAge(timestamp),
    summary: `${asset.position.lat.toFixed(5)}, ${asset.position.lon.toFixed(5)}${battery !== undefined ? ` · BAT ${formatPercent(battery)}` : ""}`,
  };
}

export function getQuickLink(asset: Asset, telemetry: TelemetryRecord | null, device: Device | null): QuickMetric {
  return {
    label: "LINK",
    value: formatPercent(telemetry?.signalQuality ?? asset.linkQualityPct),
    secondary: deriveLinkState(device, telemetry),
  };
}

export function getQuickMode(telemetry: TelemetryRecord | null): QuickMetric {
  return {
    label: "MODE",
    value: telemetry?.mode ?? "UNKNOWN",
  };
}

export function getQuickOperator(userLabel: string): QuickMetric {
  return {
    label: "OPERATOR",
    value: userLabel || "UNKNOWN",
  };
}

export function getQuickLatLon(asset: Asset): QuickMetric[] {
  return [
    { label: "LAT", value: asset.position.lat.toFixed(5) },
    { label: "LON", value: asset.position.lon.toFixed(5) },
  ];
}

export function getQuickHeading(headingDeg: number | undefined) {
  const value = headingDeg ?? 0;
  const direction = value >= 315 || value < 45
    ? "Northbound"
    : value < 135
      ? "Eastbound"
      : value < 225
        ? "Southbound"
        : "Westbound";

  return {
    label: headingDeg === undefined ? "Awaiting course data" : "Course heading",
    value,
    direction,
  };
}

export function getAlertDisplay(alert: Alert) {
  return {
    severity: alert.severity.toUpperCase(),
    timeAgo: formatRelativeAge(alert.observedAt),
    title: asString((alert as { metadata?: Record<string, unknown> }).metadata?.label) ?? toTitleCase(alert.title),
  };
}
