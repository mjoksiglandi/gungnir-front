import type { Alert, Asset, GeoLayer } from "@/shared/contracts/operational";
import type { LatLngExpression } from "leaflet";
import type { GeoJsonFeature, MapLayerMetadata } from "@/types/api";
import type { MapLayer } from "@/types/domain";
import type { AssetTrackPoint, IncidentSignal, LayerState } from "./types";

type FeatureProperties = GeoJsonFeature["properties"];
export const NATURAL_HAZARD_LAYER_IDS = [
  "layer-fire-intel",
  "layer-earthquakes",
  "layer-weather-hazards",
] as const;

export const NATURAL_HAZARD_QUERY_ALIASES: Record<string, string> = {
  active_fires: "layer-fire-intel",
  day_night: "dayNight",
  earthquakes: "layer-earthquakes",
  fires: "layer-fire-intel",
  fire: "layer-fire-intel",
  weather: "layer-weather-hazards",
  weather_hazards: "layer-weather-hazards",
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function statusColor(status: Asset["status"]) {
  if (status === "nominal") return "#56d974";
  if (status === "degraded") return "#f0b24e";
  return "#f04f63";
}

export function alertColor(severity: Alert["severity"]) {
  if (severity === "critical") return "#ff5a6f";
  if (severity === "high") return "#ff7b39";
  if (severity === "medium") return "#f2b24d";
  return "#7ad6ff";
}

export function assetGlyph(assetType: Asset["assetType"]) {
  if (assetType === "air") return "&#9992;";
  if (assetType === "ground") return "&#9643;";
  if (assetType === "autonomous") return "&#9651;";
  if (assetType === "personnel") return "&#9679;";
  return "&#9673;";
}

export function layerPositions(layer: GeoLayer): LatLngExpression[] {
  return layer.polygon.map(({ lat, lon }) => [lat, lon]);
}

export function createInitialLayerState(layers: GeoLayer[]): LayerState {
  const geofencesVisible = layers.some((layer) => layer.visibleByDefault);

  return {
    airTraffic: true,
    earthquakes: true,
    groundTraffic: true,
    incidents: true,
    routes: false,
    geofences: geofencesVisible,
    heatZones: true,
    dayNight: false,
    wildfires: true,
    labels: false,
  };
}

export function buildInitialTracks(assets: Asset[]) {
  return Object.fromEntries(
    assets.map((asset) => [
      asset.id,
      [
        {
          lat: asset.position.lat,
          lon: asset.position.lon,
        },
      ],
    ]),
  ) as Record<string, AssetTrackPoint[]>;
}

function sameTrackPoint(left: AssetTrackPoint | undefined, right: AssetTrackPoint) {
  return left?.lat === right.lat && left?.lon === right.lon;
}

export function mergeAssetTracks(current: Record<string, AssetTrackPoint[]>, assets: Asset[]) {
  const nextTracks = { ...current };

  for (const asset of assets) {
    const nextPoint = {
      lat: asset.position.lat,
      lon: asset.position.lon,
    };
    const currentTrack = nextTracks[asset.id] ?? [];

    if (sameTrackPoint(currentTrack[currentTrack.length - 1], nextPoint)) {
      nextTracks[asset.id] = currentTrack;
      continue;
    }

    nextTracks[asset.id] = [...currentTrack, nextPoint];
  }

  return nextTracks;
}

export function buildIncidentSignals(assets: Asset[], alerts: Alert[]): IncidentSignal[] {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));

  return alerts.flatMap((alert, index) => {
    const anchorAsset = alert.assetId ? assetById.get(alert.assetId) : null;

    if (!anchorAsset) return [];

    return [
      {
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        status: alert.status,
        zoneLat: anchorAsset.position.lat + (index * 0.0025) - 0.0015,
        zoneLon: anchorAsset.position.lon + (index * 0.003) + 0.001,
        anchorLat: anchorAsset.position.lat,
        anchorLon: anchorAsset.position.lon,
      },
    ];
  });
}

export function isRiskMapLayer(layer: Pick<MapLayer, "id" | "metadata" | "sourceType">) {
  return layer.id === "layer-dgac-notams"
    || layer.sourceType === "notams"
    || layer.metadata.dataset === "notams";
}

export function isReferenceMapLayer(layer: Pick<MapLayer, "metadata" | "sourceType">) {
  return layer.sourceType === "external" && !isRiskMapLayer({ ...layer, id: "" });
}

function normalizeLayerText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isAllowedDgacMapLayer(layer: Pick<MapLayer, "id" | "metadata" | "name">) {
  const provider = normalizeLayerText(layer.metadata.provider);
  const dataset = normalizeLayerText(layer.metadata.dataset);
  const marker = normalizeLayerText(layer.metadata.style?.marker);
  const name = normalizeLayerText(layer.name);
  const isDgacLayer = provider === "dgac" || layer.id.startsWith("layer-dgac-");

  if (!isDgacLayer) {
    return true;
  }

  if (layer.id === "layer-dgac-rpa" || dataset === "notams-rpa" || marker === "rpa" || marker === "drone") {
    return false;
  }

  return layer.id === "layer-dgac-aerodromes"
    || layer.id === "layer-dgac-airports"
    || layer.id === "layer-dgac-notams"
    || dataset === "aerodrome"
    || dataset === "aerodromes"
    || dataset === "airport"
    || dataset === "airports"
    || dataset === "notams"
    || marker === "aerodrome"
    || marker === "airport"
    || name.includes("aerodrome")
    || name.includes("aerodromo")
    || name.includes("aeródromo")
    || name.includes("airport")
    || name.includes("aeropuerto")
    || name.includes("notam");
}

export function isAllowedMapLayer(layer: Pick<MapLayer, "id" | "metadata" | "name" | "sourceType">) {
  return layer.sourceType !== "air-traffic"
    && isAllowedDgacMapLayer(layer);
}

export function isNaturalHazardMapLayer(layer: Pick<MapLayer, "id" | "metadata" | "sourceType">) {
  return NATURAL_HAZARD_LAYER_IDS.includes(layer.id as (typeof NATURAL_HAZARD_LAYER_IDS)[number])
    || layer.sourceType === "fire-intel"
    || layer.sourceType === "earthquakes"
    || layer.metadata.dataset === "fires"
    || layer.metadata.dataset === "earthquakes"
    || layer.metadata.dataset === "weather-hazards";
}

export function mapLayerVisibleByDefault(layer: Pick<MapLayer, "enabled" | "id" | "metadata" | "sourceType">) {
  if (typeof layer.metadata?.visibleByDefault === "boolean") {
    return layer.metadata.visibleByDefault;
  }

  if (isRiskMapLayer(layer)) {
    return true;
  }

  return layer.sourceType === "internal" ? layer.enabled : false;
}

export function mapLayerDisplayColor(layer: Pick<MapLayer, "id" | "metadata">) {
  if (typeof layer.metadata.style?.color === "string") {
    return layer.metadata.style.color;
  }

  if (typeof layer.metadata.style?.strokeColor === "string") {
    return layer.metadata.style.strokeColor;
  }

  if (typeof layer.metadata.style?.fillColor === "string") {
    return layer.metadata.style.fillColor;
  }

  if (typeof layer.metadata.color === "string") {
    return layer.metadata.color;
  }

  if (layer.id === "layer-dgac-aerodromes") return "#0069c2";
  if (layer.id === "layer-dgac-airports") return "#0069c2";
  if (layer.id === "layer-dgac-notams") return "#ff8b4b";
  if (layer.id === "layer-fire-intel") return "#ff6b00";
  if (layer.id === "layer-earthquakes") return "#ff9500";
  if (layer.id === "layer-weather-hazards") return "#e040fb";

  return "#7ad6ff";
}

export function mapLayerDisplayIcon(layer: Pick<MapLayer, "id" | "metadata">) {
  const marker = normalizeLayerText(layer.metadata.style?.marker);

  if (layer.id === "layer-fire-intel" || marker === "fire") return "F";
  if (layer.id === "layer-earthquakes" || marker === "earthquake" || marker === "seismic") return "Q";
  if (layer.id === "layer-weather-hazards" || marker === "weather") return "W";
  if (layer.id === "layer-dgac-aerodromes" || layer.id === "layer-dgac-airports") return "A";
  if (layer.id === "layer-dgac-notams") return "!";

  return "*";
}

export function mapLayerDatasetLabel(metadata: MapLayerMetadata | undefined) {
  if (!metadata?.provider && !metadata?.dataset) {
    return "custom dataset";
  }

  if (metadata.provider === "dgac" && metadata.dataset === "notams") {
    return "DGAC NOTAM";
  }

  if (metadata.provider === "dgac" && metadata.dataset === "aerodrome") {
    return "DGAC aerodromes";
  }

  if (metadata.provider === "dgac" && metadata.dataset === "airport") {
    return "DGAC airports";
  }

  if (metadata.dataset === "fires") return "NASA FIRMS";
  if (metadata.dataset === "earthquakes") return "USGS M2.5+";
  if (metadata.dataset === "weather-hazards") return "EONET/NWS";

  return [metadata.provider, metadata.dataset].filter(Boolean).join(" ");
}

function isIndexedPropertyKey(key: string) {
  return /^\d+$/.test(key);
}

function readFeatureText(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return null;
}

function readFeatureDetail(properties: FeatureProperties) {
  return readFeatureText(properties.detail)
    ?? readFeatureText(properties.details)
    ?? readFeatureText(properties.text)
    ?? readFeatureText(properties.summary)
    ?? readFeatureText(properties.description)
    ?? readFeatureText(properties.message)
    ?? readFeatureText(properties.remarks)
    ?? readFeatureText(properties.note)
    ?? readFeatureText(properties.rawDetail);
}

export function normalizeFeatureProperties(properties: FeatureProperties) {
  const indexedKeys = Object.keys(properties)
    .filter(isIndexedPropertyKey)
    .sort((left, right) => Number(left) - Number(right));
  const directProperties = Object.fromEntries(
    Object.entries(properties).filter(([key]) => !isIndexedPropertyKey(key)),
  );

  if (indexedKeys.length === 0) {
    return directProperties;
  }

  const serialized = indexedKeys
    .map((key) => (typeof properties[key] === "string" ? properties[key] : ""))
    .join("");

  try {
    const parsed = JSON.parse(serialized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        ...(parsed as FeatureProperties),
        ...directProperties,
      };
    }
  } catch {
    // Keep the raw non-indexed properties when upstream sends malformed JSON fragments.
  }

  return {
    rawDetail: serialized,
    ...directProperties,
  };
}

export function getFeatureLabel(feature: GeoJsonFeature) {
  const properties = normalizeFeatureProperties(feature.properties);
  const name = readFeatureText(properties.name);
  const pointName = readFeatureText(properties.pointName);
  const codeOaci = readFeatureText(properties.codeOaci);
  const code = readFeatureText(properties.code);
  const zoneCode = readFeatureText(properties.zoneCode);
  const series = readFeatureText(properties.series);

  return name ?? pointName ?? codeOaci ?? code ?? zoneCode ?? series ?? null;
}

export function getFeaturePopupLines(feature: GeoJsonFeature) {
  const properties = normalizeFeatureProperties(feature.properties);
  const category = readFeatureText(properties.category);
  const isNotamLike = Boolean(
    category === "notam"
      || category === "notams"
      || category === "warning"
      || category === "dgac-notam"
      || category === "dgac_notam"
      || category === "notice"
      || readFeatureText(properties.detail)
      || readFeatureText(properties.text)
      || readFeatureText(properties.notamId)
      || readFeatureText(properties.series)
      || readFeatureText(properties.schedule)
      || readFeatureText(properties.radiusNm)
      || normalizeLayerText(properties.provider) === "dgac",
  );

  if (category === "fire") {
    return [
      ["Provider", properties.provider],
      ["Brightness", properties.brightness],
      ["Confidence", properties.confidence],
      ["FRP", properties.frp],
      ["Satellite", properties.satellite],
      ["Instrument", properties.instrument],
      ["Observed", properties.observedAt],
    ].map(([label, value]) => {
      const text = readFeatureText(value);
      return text ? `${label}: ${text}` : null;
    }).filter((line): line is string => Boolean(line));
  }

  if (category === "earthquake") {
    return [
      ["Magnitude", properties.magnitude],
      ["Place", properties.place],
      ["Depth", properties.depthKm ? `${properties.depthKm} km` : null],
      ["Observed", properties.observedAt],
      ["Tsunami", properties.tsunami],
      ["Felt", properties.felt],
      ["Alert", properties.alert],
      ["USGS", properties.url],
    ].map(([label, value]) => {
      const text = readFeatureText(value);
      return text ? `${label}: ${text}` : null;
    }).filter((line): line is string => Boolean(line));
  }

  if (
    !isNotamLike
    && (category || properties.provider === "NASA EONET" || properties.provider === "NOAA/NWS")
  ) {
    return [
      ["Type", properties.type],
      ["Provider", properties.provider],
      ["Severity", properties.severity],
      ["Area", properties.area],
      ["Observed", properties.observedAt],
      ["Expires", properties.expiresAt],
    ].map(([label, value]) => {
      const text = readFeatureText(value);
      return text ? `${label}: ${text}` : null;
    }).filter((line): line is string => Boolean(line));
  }

  const detail = readFeatureDetail(properties);

  if (isNotamLike) {
    const notamDetail = detail ?? readFeatureText(properties.text);
    const notamLines = [
      ["Detail", notamDetail],
    ].map(([label, value]) => {
      const text = readFeatureText(value);
      return text ? `${label}: ${text}` : null;
    }).filter((line): line is string => Boolean(line));

    return notamLines;
  }

  const candidates: Array<[string, unknown]> = [
    ["OACI", properties.codeOaci],
    ["IATA", properties.codeIata],
    ["Code", properties.code],
    ["Point", properties.pointName],
    ["Aerodrome", properties.aerodrome],
    ["FIR", properties.fir],
    ["Zone", properties.zoneCode],
    ["NOTAM", properties.notamId],
    ["Series", properties.series],
    ["Schedule", properties.schedule],
    ["Lower", properties.lowerLimit],
    ["Upper", properties.upperLimit],
    ["Radius", properties.radiusNm ? `${properties.radiusNm} NM` : null],
    ["From", properties.validFrom],
    ["To", properties.validTo],
    ["Expires", properties.expiresAt],
    ["Public", properties.isPublic],
  ];
  const lines = candidates
    .map(([label, value]) => {
      const text = readFeatureText(value);
      return text ? `${label}: ${text}` : null;
    })
    .filter((line): line is string => Boolean(line));

  if (detail && !lines.includes(detail)) {
    return [detail, ...lines];
  }

  return lines;
}

export function getQueryLayerIds(layersParam: string | null) {
  if (!layersParam) return new Set<string>();

  return new Set(
    layersParam
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .map((token) => NATURAL_HAZARD_QUERY_ALIASES[token] ?? token)
      .filter(Boolean),
  );
}
