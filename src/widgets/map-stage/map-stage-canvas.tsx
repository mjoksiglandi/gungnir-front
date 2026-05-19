"use client";

import { Fragment, useEffect } from "react";
import type { GeoJsonObject } from "geojson";
import { divIcon, type LatLngExpression, type Layer as LeafletLayer } from "leaflet";
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
import type { DrawnGeofence, FocusRequest, IncidentSignal, LayerState } from "./types";
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

function mapLayerColor(layer: MapLayer) {
  return mapLayerDisplayColor(layer);
}

function mapLayerMarkerGlyph(layer: MapLayer) {
  if (layer.id === "layer-dgac-aerodromes") return "A";
  if (layer.id === "layer-dgac-airports") return "A";
  if (layer.id === "layer-dgac-notams") return "!";
  return "*";
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

function getFeaturePopupHtml(layerName: string, feature: GeoJsonFeature) {
  const title = getFeatureLabel(feature) ?? layerName;
  const lines = getFeaturePopupLines(feature);

  if (!title && lines.length === 0) {
    return null;
  }

  const safeLines = lines.map((line) => escapeHtml(line));
  return safeLines.length > 0
    ? `<strong>${escapeHtml(title)}</strong><br />${safeLines.join("<br />")}`
    : `<strong>${escapeHtml(title)}</strong>`;
}

function bindFeaturePopup(layerName: string, feature: GeoJsonFeature, layer: LeafletLayer) {
  const popupHtml = getFeaturePopupHtml(layerName, feature);
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

export function MapStageCanvas({
  basemapMode,
  drawMode,
  drawPoints,
  drawnGeofences,
  focusRequest,
  followTarget,
  geofences,
  incidentSignals,
  layerState,
  layers,
  mapLayers,
  onAddDrawPoint,
  onOpenAsset,
  selectedAssetTrack,
  visibleAssets,
}: Readonly<{
  basemapMode: "map" | "satellite";
  drawMode: boolean;
  drawPoints: Array<{ lat: number; lon: number }>;
  drawnGeofences: DrawnGeofence[];
  focusRequest: FocusRequest | null;
  followTarget: LatLngExpression | null;
  geofences: Geofence[];
  incidentSignals: IncidentSignal[];
  layerState: LayerState;
  layers: GeoLayer[];
  mapLayers: MapLayer[];
  onAddDrawPoint: (point: { lat: number; lon: number }) => void;
  onOpenAsset: (assetId: string) => void;
  selectedAssetTrack: LatLngExpression[];
  visibleAssets: Asset[];
}>) {
  const center: LatLngExpression = [-33.454, -70.655];

  return (
    <MapContainer
      attributionControl={false}
      center={center}
      className={styles.map}
      scrollWheelZoom
      zoom={11}
      zoomControl={false}
    >
      <MapDrawingCapture enabled={drawMode} onAddPoint={onAddDrawPoint} />
      <MapViewportController focusRequest={focusRequest} followTarget={followTarget} />

      {basemapMode === "map" ? (
        <TileLayer
          attribution="&copy; Esri, DeLorme, NAVTEQ"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
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
                const radiusMeters = getMapLayerRadiusMeters(layer, feature);

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
                    <Marker
                      icon={resolveMapLayerPointIcon(layer)}
                      position={coordinates}
                    >
                      {popupTitle || popupLines.length > 0 ? (
                        <Popup>
                          <strong>{popupTitle}</strong>
                          {popupLines.length > 0 ? <br /> : null}
                          {popupLines.map((line, index) => (
                            <Fragment key={`${feature.id ?? layer.id}-popup-${index}`}>
                              {index > 0 ? <br /> : null}
                              {line}
                            </Fragment>
                          ))}
                        </Popup>
                      ) : null}
                      {layerState.labels && popupTitle ? (
                        <Tooltip className={styles.mapTooltip} direction="top" permanent>
                          {popupTitle}
                        </Tooltip>
                      ) : null}
                    </Marker>
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
              bindFeaturePopup(layer.name, feature as GeoJsonFeature, leafletLayer);
            }}
            style={() => mapLayerGeoJsonStyle(layer)}
          />
        );
      })}

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
