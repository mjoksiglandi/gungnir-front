"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { FeatureCollection, GeoJsonObject } from "geojson";
import { divIcon, type LatLngExpression, type Layer as LeafletLayer } from "leaflet";
import maplibregl, { type GeoJSONSource, type StyleSpecification } from "maplibre-gl";
import {
  Circle as LeafletCircle,
  CircleMarker as LeafletCircleMarker,
  GeoJSON as LeafletGeoJson,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Asset, GeoLayer } from "@/shared/contracts/operational";
import type { EarthquakeEvent, FireHotspot } from "@/shared/geospatial/contracts";
import type { Geofence, MapLayer } from "@/types/domain";
import type { GeoJsonFeature } from "@/types/api";
import {
  alertColor,
  assetGlyph,
  escapeHtml,
  getFeatureLabel,
  getFeaturePopupLines,
  layerPositions,
  mapLayerDisplayColor,
  normalizeFeatureProperties,
  statusColor,
} from "./helpers";
import type { BasemapMode, DrawnGeofence, FocusRequest, IncidentSignal, InitialMapView, LayerState } from "./types";
import styles from "../map-stage.module.css";

function assetIcon(asset: Asset) {
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

function incidentIcon(severity: IncidentSignal["severity"]) {
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

function earthquakeColor(event: EarthquakeEvent) {
  if (event.magnitude >= 6) return "#ff5a6f";
  if (event.magnitude >= 5) return "#ff8b4b";
  if (event.magnitude >= 4) return "#f2b24d";
  return "#7ad6ff";
}

function earthquakeRadius(event: EarthquakeEvent) {
  return Math.max(4, Math.min(16, event.magnitude * 2.2));
}

function wildfireColor(hotspot: FireHotspot) {
  if (hotspot.frp >= 40 || hotspot.brightness >= 360) return "#ff4d2d";
  if (hotspot.frp >= 15 || hotspot.brightness >= 340) return "#ff7b39";
  if (hotspot.frp >= 5 || hotspot.brightness >= 320) return "#ffb347";
  return "#ffd36e";
}

function wildfireRadius(hotspot: FireHotspot) {
  return Math.max(3, Math.min(11, 3 + hotspot.frp / 6));
}

function mapLayerColor(layer: MapLayer) {
  return mapLayerDisplayColor(layer);
}

function mapLayerMarkerGlyph(layer: MapLayer) {
  if (layer.id === "layer-fire-intel") return "F";
  if (layer.id === "layer-earthquakes") return "~";
  if (layer.id === "layer-weather-hazards") return "W";
  if (layer.id === "layer-dgac-aerodromes") return "A";
  if (layer.id === "layer-dgac-airports") return "A";
  if (layer.id === "layer-dgac-notams") return "!";
  return "*";
}

function readNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function naturalHazardColor(properties: GeoJsonFeature["properties"], fallback: string) {
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

function naturalHazardRadius(layer: MapLayer, feature: GeoJsonFeature) {
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

function shouldShowNaturalHazardLabel(layer: MapLayer, feature: GeoJsonFeature) {
  const properties = normalizeFeatureProperties(feature.properties);
  const magnitude = readNumber(properties.magnitude);

  return layer.id === "layer-weather-hazards" || (layer.id === "layer-earthquakes" && (magnitude ?? 0) >= 4.5);
}

function naturalHazardLabel(layer: MapLayer, feature: GeoJsonFeature) {
  const properties = normalizeFeatureProperties(feature.properties);
  const magnitude = readNumber(properties.magnitude);
  if (layer.id === "layer-earthquakes" && magnitude) return magnitude.toFixed(1);

  return getFeatureLabel(feature)
    ?? (typeof properties.title === "string" ? properties.title : null)
    ?? layer.name;
}

function readText(value: unknown) {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return null;
}

function formatCoordinate(value: number) {
  return `${value.toFixed(3)}°`;
}

function hazardPopupTitle(layer: MapLayer, feature: GeoJsonFeature) {
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

function hazardPopupItems(layer: MapLayer, feature: GeoJsonFeature, coordinates: [number, number]) {
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

function HazardPopup({
  coordinates,
  feature,
  layer,
}: Readonly<{
  coordinates: [number, number];
  feature: GeoJsonFeature;
  layer: MapLayer;
}>) {
  const color = naturalHazardColor(feature.properties, mapLayerColor(layer));
  const items = hazardPopupItems(layer, feature, coordinates)
    .map(([label, value]) => [String(label), readText(value)] as const)
    .filter(([, value]) => Boolean(value));

  return (
    <div className={styles.hazardPopup} style={{ "--layer-color": color } as CSSProperties}>
      <header className={styles.hazardPopupHeader}>
        <span className={styles.hazardPopupIcon}>{mapLayerMarkerGlyph(layer)}</span>
        <strong>{hazardPopupTitle(layer, feature)}</strong>
      </header>
      <dl className={styles.hazardPopupGrid}>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function InfoPopup({
  accentColor,
  items,
  marker,
  title,
}: Readonly<{
  accentColor: string;
  items: Array<readonly [label: string, value: string]>;
  marker: string;
  title: string;
}>) {
  return (
    <div className={styles.infoPopup} style={{ "--layer-color": accentColor } as CSSProperties}>
      <header className={styles.infoPopupHeader}>
        <span className={styles.infoPopupIcon}>{marker}</span>
        <strong>{title}</strong>
      </header>
      <dl className={styles.infoPopupGrid}>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function isNaturalHazardLayer(layer: MapLayer) {
  return layer.id === "layer-fire-intel"
    || layer.id === "layer-earthquakes"
    || layer.id === "layer-weather-hazards";
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

function resolveMapLayerPointIcon(layer: MapLayer) {
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

function getPointCoordinates(feature: GeoJsonFeature) {
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

function getMapLayerRadiusMeters(layer: MapLayer, feature: GeoJsonFeature) {
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

function mapLayerGeoJsonStyle(layer: MapLayer) {
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

function popupEntriesFromLines(lines: string[]) {
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

function getFeaturePopupHtml(layer: MapLayer, feature: GeoJsonFeature) {
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

function bindFeaturePopup(mapLayer: MapLayer, feature: GeoJsonFeature, layer: LeafletLayer) {
  const popupHtml = getFeaturePopupHtml(mapLayer, feature);
  if (!popupHtml || !("bindPopup" in layer) || typeof layer.bindPopup !== "function") {
    return;
  }

  layer.bindPopup(popupHtml);
}

function MapDrawingCapture({
  enabled,
  onAddPoint,
}: Readonly<{
  enabled: boolean;
  onAddPoint: (point: { lat: number; lon: number }) => void;
}>) {
  useMapEvents({
    click(event) {
      if (!enabled) return;

      onAddPoint({
        lat: event.latlng.lat,
        lon: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapViewportController({
  focusRequest,
  followTarget,
}: Readonly<{
  focusRequest: FocusRequest | null;
  followTarget: LatLngExpression | null;
}>) {
  const map = useMap();

  useEffect(() => {
    if (!focusRequest) return;

    const zoom = Math.max(map.getZoom(), 13);
    map.flyTo(focusRequest.position, zoom, {
      animate: true,
      duration: 0.8,
    });
  }, [focusRequest, map]);

  useEffect(() => {
    if (!followTarget) return;

    const zoom = Math.max(map.getZoom(), 14);
    map.flyTo(followTarget, zoom, {
      animate: true,
      duration: 0.8,
    });
  }, [followTarget, map]);

  return null;
}

function normalizeLongitude(lon: number) {
  let nextLon = lon;
  while (nextLon < -180) nextLon += 360;
  while (nextLon > 180) nextLon -= 360;
  return nextLon;
}

function buildNightPolygons(date: Date): LatLngExpression[][] {
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

function DayNightOverlay() {
  const [timestamp, setTimestamp] = useState(() => Date.now());
  const polygons = useMemo(() => buildNightPolygons(new Date(timestamp)), [timestamp]);

  useEffect(() => {
    const handle = window.setInterval(() => setTimestamp(Date.now()), 5 * 60 * 1000);
    return () => window.clearInterval(handle);
  }, []);

  return (
    <>
      {polygons.map((positions, index) => (
        <Polygon
          key={`day-night-${index}`}
          pathOptions={{
            color: "#448aff",
            fillColor: "#07111f",
            fillOpacity: 0.34,
            opacity: 0.18,
            weight: 1,
          }}
          positions={positions}
        />
      ))}
    </>
  );
}

const terrainStyle: StyleSpecification = {
  version: 8,
  sources: {
    imagery: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Esri",
    },
    terrain: {
      type: "raster-dem",
      tiles: [
        "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 15,
      encoding: "terrarium",
      attribution: "AWS Terrain Tiles",
    },
  },
  layers: [
    {
      id: "imagery",
      type: "raster",
      source: "imagery",
      paint: {
        "raster-brightness-max": 0.82,
        "raster-contrast": 0.08,
        "raster-saturation": -0.1,
      },
    },
    {
      id: "terrain-shade",
      type: "hillshade",
      source: "terrain",
      paint: {
        "hillshade-exaggeration": 0.46,
        "hillshade-shadow-color": "#071018",
        "hillshade-highlight-color": "#fff2ce",
        "hillshade-accent-color": "#35627d",
      },
    },
  ],
  terrain: {
    source: "terrain",
    exaggeration: 1.45,
  },
  sky: {
    "sky-color": "#0a1420",
    "sky-horizon-blend": 0.18,
    "horizon-color": "#8fb6ca",
    "horizon-fog-blend": 0.12,
    "fog-color": "#0a1420",
    "fog-ground-blend": 0.42,
  },
};

function initialCenterTuple(center: LatLngExpression): [number, number] {
  if (Array.isArray(center)) {
    return [Number(center[0]), Number(center[1])];
  }

  if ("lat" in center && "lng" in center) {
    return [center.lat, center.lng];
  }

  return [-33.454, -70.655];
}

function Terrain3DMap({
  focusRequest,
  followTarget,
  initialView,
  incidentSignals,
  mapLayers,
  onOpenAsset,
  visibleAssets,
}: Readonly<{
  focusRequest: FocusRequest | null;
  followTarget: LatLngExpression | null;
  initialView: InitialMapView;
  incidentSignals: IncidentSignal[];
  mapLayers: MapLayer[];
  onOpenAsset: (assetId: string) => void;
  visibleAssets: Asset[];
}>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const groundAssets = useMemo(
    () => visibleAssets.filter((asset) => asset.assetType !== "air"),
    [visibleAssets],
  );
  const groundAssetsRef = useRef(groundAssets);
  const terrainEvents = useMemo(
    () => buildTerrainEventCollection(mapLayers, incidentSignals),
    [incidentSignals, mapLayers],
  );
  const terrainEventsRef = useRef(terrainEvents);

  useEffect(() => {
    groundAssetsRef.current = groundAssets;
  }, [groundAssets]);

  useEffect(() => {
    terrainEventsRef.current = terrainEvents;
  }, [terrainEvents]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const [lat, lon] = initialCenterTuple(initialView.center);
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: terrainStyle,
      center: [lon, lat],
      zoom: initialView.zoom,
      pitch: 68,
      bearing: -24,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.addSource("ground-assets", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.addLayer({
        id: "ground-assets",
        type: "circle",
        source: "ground-assets",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 7,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      });
      map.addSource("terrain-events", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.addLayer({
        id: "terrain-events",
        type: "circle",
        source: "terrain-events",
        paint: {
          "circle-color": ["get", "color"],
          "circle-opacity": 0.86,
          "circle-radius": ["get", "radius"],
          "circle-blur": 0.08,
          "circle-stroke-color": "#fff6df",
          "circle-stroke-opacity": 0.82,
          "circle-stroke-width": 1.4,
        },
      });
      map.addLayer({
        id: "ground-asset-labels",
        type: "symbol",
        source: "ground-assets",
        layout: {
          "text-field": ["get", "callsign"],
          "text-font": ["Noto Sans Regular"],
          "text-offset": [0, 1.25],
          "text-size": 11,
        },
        paint: {
          "text-color": "#f2f7fb",
          "text-halo-color": "#071018",
          "text-halo-width": 1.3,
        },
      });
      const source = map.getSource("ground-assets") as GeoJSONSource | undefined;
      source?.setData(buildGroundAssetCollection(groundAssetsRef.current));
      const eventSource = map.getSource("terrain-events") as GeoJSONSource | undefined;
      eventSource?.setData(terrainEventsRef.current);
      fitTerrainEvents(map, terrainEventsRef.current);
    });

    map.on("click", "ground-assets", (event) => {
      const assetId = event.features?.[0]?.properties?.id;
      if (typeof assetId === "string") {
        onOpenAsset(assetId);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialView.center, initialView.zoom, onOpenAsset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const source = map.getSource("ground-assets") as GeoJSONSource | undefined;
    source?.setData(buildGroundAssetCollection(groundAssets));
  }, [groundAssets]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const source = map.getSource("terrain-events") as GeoJSONSource | undefined;
    source?.setData(terrainEvents);
    fitTerrainEvents(map, terrainEvents);
  }, [terrainEvents]);

  useEffect(() => {
    const map = mapRef.current;
    const target = followTarget ?? focusRequest?.position;
    if (!map || !target) return;

    const [lat, lon] = initialCenterTuple(target);
    map.flyTo({
      center: [lon, lat],
      zoom: Math.max(map.getZoom(), 14),
      pitch: 70,
      duration: 800,
    });
  }, [focusRequest, followTarget]);

  return <div ref={containerRef} className={styles.terrainMap} />;
}

function buildGroundAssetCollection(assets: Asset[]): FeatureCollection {
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

function buildTerrainEventCollection(mapLayers: MapLayer[], incidentSignals: IncidentSignal[]): FeatureCollection {
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

function fitTerrainEvents(map: maplibregl.Map, collection: FeatureCollection) {
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

export function MapStageCanvas({
  basemapMode,
  drawMode,
  drawPoints,
  drawnGeofences,
  focusRequest,
  followTarget,
  geofences,
  initialView,
  earthquakes,
  fireHotspots,
  incidentSignals,
  layerState,
  layers,
  mapLayers,
  onAddDrawPoint,
  onOpenAsset,
  selectedAssetTrack,
  visibleAssets,
}: Readonly<{
  basemapMode: BasemapMode;
  drawMode: boolean;
  drawPoints: Array<{ lat: number; lon: number }>;
  drawnGeofences: DrawnGeofence[];
  focusRequest: FocusRequest | null;
  followTarget: LatLngExpression | null;
  geofences: Geofence[];
  initialView: InitialMapView;
  earthquakes: EarthquakeEvent[];
  fireHotspots: FireHotspot[];
  incidentSignals: IncidentSignal[];
  layerState: LayerState;
  layers: GeoLayer[];
  mapLayers: MapLayer[];
  onAddDrawPoint: (point: { lat: number; lon: number }) => void;
  onOpenAsset: (assetId: string) => void;
  selectedAssetTrack: LatLngExpression[];
  visibleAssets: Asset[];
}>) {
  if (basemapMode === "terrain3d") {
    return (
      <Terrain3DMap
        focusRequest={focusRequest}
        followTarget={followTarget}
        initialView={initialView}
        incidentSignals={incidentSignals}
        mapLayers={mapLayers}
        onOpenAsset={onOpenAsset}
        visibleAssets={visibleAssets}
      />
    );
  }

  return (
    <MapContainer
      attributionControl={false}
      center={initialView.center}
      className={styles.map}
      scrollWheelZoom
      zoom={initialView.zoom}
      zoomControl={false}
    >
      <MapDrawingCapture enabled={drawMode} onAddPoint={onAddDrawPoint} />
      <MapViewportController focusRequest={focusRequest} followTarget={followTarget} />

      {basemapMode === "map" ? (
        <>
          <TileLayer
            attribution="&copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            attribution="&copy; Esri"
            opacity={0.22}
            url="https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
          />
        </>
      ) : (
        <>
          <TileLayer
            attribution="&copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            attribution="&copy; Esri"
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          />
        </>
      )}

      {layerState.dayNight ? <DayNightOverlay /> : null}

      {layerState.geofences ? (
        <>
          {layers.map((layer) => (
            <Polygon
              key={layer.id}
              pathOptions={{
                color: layer.layerType === "zone" ? "#c68a1d" : "#3fb6ff",
                dashArray: layer.layerType === "corridor" ? "6 6" : "3 5",
                fillColor: layer.layerType === "zone" ? "#c68a1d" : "#3fb6ff",
                fillOpacity: layer.layerType === "zone" ? 0.16 : 0.05,
                weight: 1.4,
              }}
              positions={layerPositions(layer)}
            >
              {layerState.labels ? (
                <Tooltip className={styles.mapTooltip} direction="top" permanent>
                  {layer.name}
                </Tooltip>
              ) : null}
            </Polygon>
          ))}
          {geofences.map((geofence) => (
            <LeafletGeoJson
              key={geofence.id}
              data={{
                type: "Feature",
                geometry: geofence.geometry,
                properties: {
                  name: geofence.name,
                  status: geofence.status,
                },
              } as GeoJsonObject}
              style={() => ({
                color: geofence.status === "active" ? "#4bc0ff" : "#7f8a96",
                dashArray: "6 6",
                fillColor: geofence.status === "active" ? "#4bc0ff" : "#7f8a96",
                fillOpacity: 0.08,
                weight: 1.6,
              })}
            />
          ))}
          {drawnGeofences.map((geofence) => (
            <Polygon
              key={geofence.id}
              pathOptions={{
                color: "#48a7ff",
                dashArray: "8 6",
                fillColor: "#48a7ff",
                fillOpacity: 0.08,
                weight: 1.6,
              }}
              positions={geofence.polygon.map(({ lat, lon }) => [lat, lon])}
            >
              {layerState.labels ? (
                <Tooltip className={styles.mapTooltip} direction="top" permanent>
                  {geofence.name}
                </Tooltip>
              ) : null}
            </Polygon>
          ))}
          {drawMode && drawPoints.length >= 2 ? (
            <Polyline
              pathOptions={{ color: "#48a7ff", dashArray: "8 6", opacity: 0.95, weight: 2 }}
              positions={drawPoints.map(({ lat, lon }) => [lat, lon])}
            />
          ) : null}
          {drawMode
            ? drawPoints.map((point, index) => (
                <LeafletCircleMarker
                  key={`draw-point-${index}`}
                  center={[point.lat, point.lon]}
                  pathOptions={{
                    color: "#7ad6ff",
                    fillColor: "#7ad6ff",
                    fillOpacity: 1,
                    weight: 1,
                  }}
                  radius={4}
                />
              ))
            : null}
        </>
      ) : null}

      {mapLayers.map((layer) => {
        if (!layer.featureCollection) {
          return null;
        }

        const isPointLayer = layer.layerType === "point" || layer.metadata.geometryType === "Point";

        if (isPointLayer) {
          return (
            <Fragment key={layer.id}>
              {layer.featureCollection.features.map((feature) => {
                const coordinates = getPointCoordinates(feature);
                if (!coordinates) {
                  return null;
                }

                const popupTitle = getFeatureLabel(feature) ?? layer.name;
                const popupLines = getFeaturePopupLines(feature);
                const popupEntries = popupEntriesFromLines(popupLines).map((entry) => [entry.label, entry.value] as const);
                const radiusMeters = getMapLayerRadiusMeters(layer, feature);
                const isNaturalHazard = isNaturalHazardLayer(layer);
                const hazardColor = naturalHazardColor(feature.properties, mapLayerColor(layer));

                return (
                  <Fragment key={feature.id ?? `${layer.id}-${coordinates[0]}-${coordinates[1]}`}>
                    {radiusMeters ? (
                      <LeafletCircle
                        center={coordinates}
                        pathOptions={{
                          color: mapLayerColor(layer),
                          fillColor: mapLayerColor(layer),
                          fillOpacity: 0,
                          opacity: 0.75,
                        }}
                        radius={radiusMeters}
                      />
                    ) : null}
                    {isNaturalHazard ? (
                      <LeafletCircleMarker
                        center={coordinates}
                        pathOptions={{
                          color: hazardColor,
                          fillColor: hazardColor,
                          fillOpacity: layer.id === "layer-weather-hazards" ? 0.82 : 0.74,
                          opacity: 0.95,
                          weight: 1,
                        }}
                        radius={naturalHazardRadius(layer, feature)}
                      >
                        {popupTitle || popupLines.length > 0 ? (
                          <Popup>
                            <HazardPopup coordinates={coordinates} feature={feature} layer={layer} />
                          </Popup>
                        ) : null}
                        {shouldShowNaturalHazardLabel(layer, feature) ? (
                          <Tooltip className={styles.mapTooltip} direction="top" permanent>
                            {naturalHazardLabel(layer, feature)}
                          </Tooltip>
                        ) : null}
                      </LeafletCircleMarker>
                    ) : (
                      <Marker
                        icon={resolveMapLayerPointIcon(layer)}
                        position={coordinates}
                      >
                        {popupTitle || popupEntries.length > 0 ? (
                          <Popup>
                            <InfoPopup
                              accentColor={mapLayerColor(layer)}
                              items={popupEntries}
                              marker={mapLayerMarkerGlyph(layer)}
                              title={popupTitle}
                            />
                          </Popup>
                        ) : null}
                        {layerState.labels && popupTitle ? (
                          <Tooltip className={styles.mapTooltip} direction="top" permanent>
                            {popupTitle}
                          </Tooltip>
                        ) : null}
                      </Marker>
                    )}
                  </Fragment>
                );
              })}
            </Fragment>
          );
        }

        return (
          <LeafletGeoJson
            key={layer.id}
            data={layer.featureCollection as GeoJsonObject}
            onEachFeature={(feature, leafletLayer) => {
              bindFeaturePopup(layer, feature as GeoJsonFeature, leafletLayer);
            }}
            style={() => mapLayerGeoJsonStyle(layer)}
          />
        );
      })}

      {layerState.earthquakes
        ? earthquakes.map((event) => {
            const color = earthquakeColor(event);
            return (
              <LeafletCircleMarker
                key={event.id}
                center={[event.lat, event.lon]}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.78,
                  opacity: 0.92,
                  weight: 1.2,
                }}
                radius={earthquakeRadius(event)}
              >
                <Popup>
                  <InfoPopup
                    accentColor={color}
                    items={[
                      ["Place", event.place],
                      ["Depth", `${event.depthKm.toFixed(1)} km`],
                      ["Time", new Date(event.occurredAt).toLocaleString()],
                      ...(event.tsunami ? [["Tsunami", "Yes"] as const] : []),
                    ]}
                    marker="~"
                    title={`M ${event.magnitude.toFixed(1)}`}
                  />
                </Popup>
                {layerState.labels ? (
                  <Tooltip className={styles.mapTooltip} direction="top" permanent>
                    M {event.magnitude.toFixed(1)}
                  </Tooltip>
                ) : null}
              </LeafletCircleMarker>
            );
          })
        : null}

      {layerState.wildfires
        ? fireHotspots.map((hotspot) => {
            const color = wildfireColor(hotspot);
            return (
              <LeafletCircleMarker
                key={hotspot.id}
                center={[hotspot.lat, hotspot.lon]}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.82,
                  opacity: 0.95,
                  weight: 1,
                }}
                radius={wildfireRadius(hotspot)}
              >
                <Popup>
                  <InfoPopup
                    accentColor={color}
                    items={[
                      ["Brightness", hotspot.brightness.toFixed(1)],
                      ["FRP", hotspot.frp.toFixed(2)],
                      ["Confidence", String(hotspot.confidence)],
                      ["Acquired", hotspot.acquiredAt ? new Date(hotspot.acquiredAt).toLocaleString() : "Unknown"],
                    ]}
                    marker="F"
                    title="FIRMS Hotspot"
                  />
                </Popup>
                {layerState.labels ? (
                  <Tooltip className={styles.mapTooltip} direction="top" permanent>
                    Fire
                  </Tooltip>
                ) : null}
              </LeafletCircleMarker>
            );
          })
        : null}

      {layerState.routes && selectedAssetTrack.length > 1 ? (
        <Polyline
          pathOptions={{ color: "#53c0ff", dashArray: "6 8", opacity: 0.9, weight: 2.25 }}
          positions={selectedAssetTrack}
        />
      ) : null}

      {layerState.incidents
        ? incidentSignals.map((signal) => (
            <Fragment key={signal.id}>
              <LeafletCircle
                center={[signal.zoneLat, signal.zoneLon]}
                pathOptions={{
                  color: alertColor(signal.severity),
                  fillColor: alertColor(signal.severity),
                  fillOpacity: 0.14,
                  opacity: 0.9,
                }}
                radius={900}
              >
                <Tooltip className={styles.mapTooltip} direction="top">
                  {signal.title}
                </Tooltip>
              </LeafletCircle>
              <Marker
                icon={incidentIcon(signal.severity)}
                position={[signal.anchorLat, signal.anchorLon]}
              >
                <Tooltip className={styles.mapTooltip} direction="top" permanent>
                  {signal.title}
                </Tooltip>
              </Marker>
            </Fragment>
          ))
        : null}

      {visibleAssets.map((asset) => (
        <Marker
          key={asset.id}
          eventHandlers={{
            click: () => {
              onOpenAsset(asset.id);
            },
          }}
          icon={assetIcon(asset)}
          position={[asset.position.lat, asset.position.lon]}
        />
      ))}
    </MapContainer>
  );
}
