import type { FeatureCollection } from "geojson";
import { divIcon, type LatLngExpression, type Layer as LeafletLayer } from "leaflet";
import maplibregl from "maplibre-gl";
import type { Asset } from "@/shared/contracts/operational";
import type { EarthquakeEvent, FireHotspot } from "@/shared/geospatial/contracts";
import type { MapLayer } from "@/types/domain";
import type { GeoJsonFeature } from "@/types/api";
import {
  alertColor,
  assetGlyph,
  escapeHtml,
  getFeatureLabel,
  getFeaturePopupLines,
  mapLayerDisplayColor,
  normalizeFeatureProperties,
  statusColor,
} from "./helpers";
import type { IncidentSignal } from "./types";
import styles from "../map-stage.module.css";

export function assetIcon(asset: Asset) {
  const color = statusColor(asset.status);
  const safeCallsign = escapeHtml(asset.callsign);
  const safeName = escapeHtml(asset.name);

  return divIcon({
    className: styles.assetIconWrapper,
    html: `
      <div class="${styles.assetMarkerShell}">
        <div class="${styles.assetMarker}" style="--status-color:${color}">
          <span class="${styles.assetGlyph}">${assetGlyph(asset.assetType)}</span>
        </div>
        <div class="${styles.assetLabel}">
          <strong>${safeCallsign}</strong>
          <span>${safeName}</span>
        </div>
      </div>
    `,
    iconAnchor: [14, 14],
    iconSize: [126, 40],
  });
}

export function incidentIcon(severity: IncidentSignal["severity"]) {
  const color = alertColor(severity);

  return divIcon({
    className: styles.assetIconWrapper,
    html: `
      <div class="${styles.incidentIconShell}">
        <div class="${styles.incidentIcon}" style="--incident-color:${color}">
          !
        </div>
      </div>
    `,
    iconAnchor: [12, 12],
    iconSize: [24, 24],
  });
}

export function earthquakeColor(event: EarthquakeEvent) {
  if (event.magnitude >= 6) return "#ff5a6f";
  if (event.magnitude >= 5) return "#ff8b4b";
  if (event.magnitude >= 4) return "#f2b24d";
  return "#7ad6ff";
}

export function earthquakeRadius(event: EarthquakeEvent) {
  return Math.max(4, Math.min(16, event.magnitude * 2.2));
}

export function wildfireColor(hotspot: FireHotspot) {
  if (hotspot.frp >= 40 || hotspot.brightness >= 360) return "#ff4d2d";
  if (hotspot.frp >= 15 || hotspot.brightness >= 340) return "#ff7b39";
  if (hotspot.frp >= 5 || hotspot.brightness >= 320) return "#ffb347";
  return "#ffd36e";
}

export function wildfireRadius(hotspot: FireHotspot) {
  return Math.max(3, Math.min(11, 3 + hotspot.frp / 6));
}

export function mapLayerColor(layer: MapLayer) {
  return mapLayerDisplayColor(layer);
}

export function mapLayerMarkerGlyph(layer: MapLayer) {
  if (layer.id === "layer-fire-intel") return "F";
  if (layer.id === "layer-earthquakes") return "~";
  if (layer.id === "layer-weather-hazards") return "W";
  if (layer.id === "layer-dgac-aerodromes") return "A";
  if (layer.id === "layer-dgac-airports") return "A";
  if (layer.id === "layer-dgac-notams") return "!";
  return "*";
}

export function readNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function readText(value: unknown) {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return null;
}

export function isNaturalHazardLayer(layer: MapLayer) {
  return layer.id === "layer-fire-intel"
    || layer.id === "layer-earthquakes"
    || layer.id === "layer-weather-hazards";
}

export function naturalHazardColor(properties: GeoJsonFeature["properties"], fallback: string) {
  const normalized = normalizeFeatureProperties(properties);
  const category = typeof normalized.category === "string" ? normalized.category : "";
  const severity = typeof normalized.severity === "string" ? normalized.severity.toLowerCase() : "";
  const magnitude = readNumber(normalized.magnitude);

  if (category === "fire") return "#ff6b00";
  if (category === "earthquake") {
    if ((magnitude ?? 0) >= 6) return "#ff3d00";
    if ((magnitude ?? 0) >= 4.5) return "#ff9500";
    return "#ffc247";
  }
  if (severity.includes("extreme") || severity.includes("severe")) return "#f50057";
  if (severity.includes("moderate")) return "#e040fb";
  if (severity.includes("minor")) return "#7c4dff";

  return fallback;
}

export function naturalHazardRadius(layer: MapLayer, feature: GeoJsonFeature) {
  const properties = normalizeFeatureProperties(feature.properties);
  const category = typeof properties.category === "string" ? properties.category : "";
  const magnitude = readNumber(properties.magnitude);
  const frp = readNumber(properties.frp);

  if (layer.id === "layer-fire-intel" || category === "fire") {
    return Math.max(5, Math.min(16, 6 + ((frp ?? 0) / 35)));
  }

  if (layer.id === "layer-earthquakes" || category === "earthquake") {
    return Math.max(5, Math.min(22, 4 + ((magnitude ?? 2.5) * 2.4)));
  }

  return 8;
}

export function shouldShowNaturalHazardLabel(layer: MapLayer, feature: GeoJsonFeature) {
  const properties = normalizeFeatureProperties(feature.properties);
  const magnitude = readNumber(properties.magnitude);

  return layer.id === "layer-weather-hazards" || (layer.id === "layer-earthquakes" && (magnitude ?? 0) >= 4.5);
}

export function naturalHazardLabel(layer: MapLayer, feature: GeoJsonFeature) {
  const properties = normalizeFeatureProperties(feature.properties);
  const magnitude = readNumber(properties.magnitude);
  if (layer.id === "layer-earthquakes" && magnitude) return magnitude.toFixed(1);

  return getFeatureLabel(feature)
    ?? (typeof properties.title === "string" ? properties.title : null)
    ?? layer.name;
}

function formatCoordinate(value: number) {
  return `${value.toFixed(3)}Â°`;
}

export function hazardPopupTitle(layer: MapLayer, feature: GeoJsonFeature) {
  const properties = normalizeFeatureProperties(feature.properties);
  if (layer.id === "layer-fire-intel") return "Active Fire Detected";
  if (layer.id === "layer-earthquakes") {
    const magnitude = readNumber(properties.magnitude);
    return magnitude ? `Earthquake M${magnitude.toFixed(1)}` : "Earthquake";
  }
  if (layer.id === "layer-weather-hazards") {
    return readText(properties.title) ?? "Weather Hazard";
  }
  return getFeatureLabel(feature) ?? layer.name;
}

export function hazardPopupItems(layer: MapLayer, feature: GeoJsonFeature, coordinates: [number, number]) {
  const properties = normalizeFeatureProperties(feature.properties);
  const coords = `${formatCoordinate(coordinates[0])}, ${formatCoordinate(coordinates[1])}`;

  if (layer.id === "layer-fire-intel") {
    return [
      ["Brightness", properties.brightness],
      ["Coords", coords],
      ["Confidence", properties.confidence],
      ["FRP", properties.frp],
      ["Observed", properties.observedAt],
      ["Provider", properties.provider],
    ];
  }

  if (layer.id === "layer-earthquakes") {
    return [
      ["Magnitude", properties.magnitude],
      ["Place", properties.place],
      ["Depth", properties.depthKm ? `${properties.depthKm} km` : null],
      ["Observed", properties.observedAt],
      ["Tsunami", properties.tsunami],
      ["Felt", properties.felt],
    ];
  }

  return [
    ["Type", properties.type],
    ["Severity", properties.severity],
    ["Area", properties.area],
    ["Observed", properties.observedAt],
    ["Expires", properties.expiresAt],
    ["Provider", properties.provider],
  ];
}

function mapLayerPointIcon(layer: MapLayer) {
  const color = mapLayerColor(layer);
  const glyph = mapLayerMarkerGlyph(layer);

  return divIcon({
    className: styles.assetIconWrapper,
    html: `
      <div class="${styles.incidentIconShell}">
        <div class="${styles.incidentIcon}" style="--incident-color:${color}">
          ${glyph}
        </div>
      </div>
    `,
    iconAnchor: [12, 12],
    iconSize: [24, 24],
  });
}

function mapLayerGlyphFromMetadata(layer: MapLayer) {
  const marker = layer.metadata.style?.marker;

  if (marker === "airport" || marker === "aerodrome") return "A";
  if (marker === "warning") return "!";
  return null;
}

export function resolveMapLayerPointIcon(layer: MapLayer) {
  const glyph = mapLayerGlyphFromMetadata(layer);

  if (!glyph) {
    return mapLayerPointIcon(layer);
  }

  const color = mapLayerColor(layer);

  return divIcon({
    className: styles.assetIconWrapper,
    html: `
      <div class="${styles.incidentIconShell}">
        <div class="${styles.incidentIcon}" style="--incident-color:${color}">
          ${glyph}
        </div>
      </div>
    `,
    iconAnchor: [12, 12],
    iconSize: [24, 24],
  });
}

export function getPointCoordinates(feature: GeoJsonFeature) {
  if (!feature.geometry || feature.geometry.type !== "Point") {
    return null;
  }

  const [lon, lat] = feature.geometry.coordinates;
  return [lat, lon] as [number, number];
}

function getRadiusMeters(radiusNm: unknown) {
  const numericValue = typeof radiusNm === "number"
    ? radiusNm
    : typeof radiusNm === "string"
      ? Number(radiusNm)
      : NaN;

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue * 1852;
}

export function getMapLayerRadiusMeters(layer: MapLayer, feature: GeoJsonFeature) {
  const marker = layer.metadata.style?.marker;
  const properties = normalizeFeatureProperties(feature.properties);
  const isNotamLike = layer.id === "layer-dgac-notams"
    || layer.sourceType === "notams"
    || layer.metadata.dataset === "notams"
    || marker === "warning";

  return isNotamLike ? getRadiusMeters(properties.radiusNm) : null;
}

function isNotamMapLayer(layer: MapLayer) {
  return layer.id === "layer-dgac-notams"
    || layer.sourceType === "notams"
    || layer.metadata.dataset === "notams"
    || layer.metadata.style?.marker === "warning";
}

export function mapLayerGeoJsonStyle(layer: MapLayer) {
  const color = mapLayerColor(layer);

  return {
    color,
    fillColor: color,
    fillOpacity: isNotamMapLayer(layer)
      ? 0
      : typeof layer.metadata.style?.fillOpacity === "number"
        ? layer.metadata.style.fillOpacity
        : 0.08,
    opacity: 0.9,
    weight: typeof layer.metadata.style?.strokeWidth === "number" ? layer.metadata.style.strokeWidth : 1.3,
  };
}

export function popupEntriesFromLines(lines: string[]) {
  return lines.map((line, index) => {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex > 0) {
      return {
        key: `${index}-${line}`,
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    }

    return {
      key: `${index}-${line}`,
      label: index === 0 ? "Detail" : `Info ${index + 1}`,
      value: line.trim(),
    };
  }).filter((entry) => entry.value.length > 0);
}

export function getFeaturePopupHtml(layer: MapLayer, feature: GeoJsonFeature) {
  const title = getFeatureLabel(feature) ?? layer.name;
  const lines = getFeaturePopupLines(feature);

  if (!title && lines.length === 0) {
    return null;
  }

  const entries = popupEntriesFromLines(lines);
  const safeEntries = entries.map((entry) => `
    <div>
      <dt>${escapeHtml(entry.label)}</dt>
      <dd>${escapeHtml(entry.value)}</dd>
    </div>
  `).join("");

  return `
    <div class="${styles.infoPopup}" style="--layer-color:${mapLayerColor(layer)}">
      <header class="${styles.infoPopupHeader}">
        <span class="${styles.infoPopupIcon}">${mapLayerMarkerGlyph(layer)}</span>
        <strong>${escapeHtml(title)}</strong>
      </header>
      ${safeEntries ? `<dl class="${styles.infoPopupGrid}">${safeEntries}</dl>` : ""}
    </div>
  `;
}

export function bindFeaturePopup(mapLayer: MapLayer, feature: GeoJsonFeature, layer: LeafletLayer) {
  const popupHtml = getFeaturePopupHtml(mapLayer, feature);
  if (!popupHtml || !("bindPopup" in layer) || typeof layer.bindPopup !== "function") {
    return;
  }

  layer.bindPopup(popupHtml);
}

function normalizeLongitude(lon: number) {
  let nextLon = lon;
  while (nextLon < -180) nextLon += 360;
  while (nextLon > 180) nextLon -= 360;
  return nextLon;
}

export function buildNightPolygons(date: Date): LatLngExpression[][] {
  const utcHours = date.getUTCHours()
    + (date.getUTCMinutes() / 60)
    + (date.getUTCSeconds() / 3600);
  const subsolarLon = normalizeLongitude(180 - (utcHours * 15));
  const antiSolarLon = normalizeLongitude(subsolarLon + 180);
  const west = normalizeLongitude(antiSolarLon - 90);
  const east = normalizeLongitude(antiSolarLon + 90);

  function rectangle(minLon: number, maxLon: number): LatLngExpression[] {
    return [
      [-90, minLon],
      [-90, maxLon],
      [90, maxLon],
      [90, minLon],
    ];
  }

  if (west <= east) {
    return [rectangle(west, east)];
  }

  return [
    rectangle(west, 180),
    rectangle(-180, east),
  ];
}

export function initialCenterTuple(center: LatLngExpression): [number, number] {
  if (Array.isArray(center)) {
    return [Number(center[0]), Number(center[1])];
  }

  if ("lat" in center && "lng" in center) {
    return [center.lat, center.lng];
  }

  return [-33.454, -70.655];
}

export function buildGroundAssetCollection(assets: Asset[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: assets.map((asset) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [asset.position.lon, asset.position.lat],
      },
      properties: {
        id: asset.id,
        callsign: asset.callsign,
        color: statusColor(asset.status),
      },
    })),
  };
}

export function buildTerrainEventCollection(mapLayers: MapLayer[], incidentSignals: IncidentSignal[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      ...mapLayers.flatMap((layer) => (layer.featureCollection?.features ?? []).flatMap((feature) => {
        const coordinates = getPointCoordinates(feature);
        if (!coordinates) return [];

        const color = isNaturalHazardLayer(layer)
          ? naturalHazardColor(feature.properties, mapLayerDisplayColor(layer))
          : mapLayerDisplayColor(layer);

        return [{
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [coordinates[1], coordinates[0]],
          },
          properties: {
            color,
            radius: isNaturalHazardLayer(layer) ? naturalHazardRadius(layer, feature) + 3 : 8,
          },
        }];
      })),
      ...incidentSignals.map((signal) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [signal.zoneLon, signal.zoneLat],
        },
        properties: {
          color: alertColor(signal.severity),
          radius: signal.severity === "critical" ? 14 : 12,
        },
      })),
    ],
  };
}

export function fitTerrainEvents(map: maplibregl.Map, collection: FeatureCollection) {
  const coordinates = collection.features
    .map((feature) => feature.geometry.type === "Point" ? feature.geometry.coordinates : null)
    .filter((point): point is number[] => Array.isArray(point));

  if (coordinates.length === 0) return;

  const bounds = coordinates.reduce(
    (nextBounds, point) => nextBounds.extend([point[0], point[1]]),
    new maplibregl.LngLatBounds(
      [coordinates[0][0], coordinates[0][1]],
      [coordinates[0][0], coordinates[0][1]],
    ),
  );

  map.fitBounds(bounds, {
    duration: 700,
    maxZoom: 8,
    padding: 90,
    pitch: 68,
  });
}
