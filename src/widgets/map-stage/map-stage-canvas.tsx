"use client";

import { Fragment, useEffect } from "react";
import { divIcon, type LatLngExpression } from "leaflet";
import {
  Circle as LeafletCircle,
  CircleMarker as LeafletCircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Asset, GeoLayer } from "@/shared/contracts/operational";
import type { FireHotspot } from "@/shared/geospatial/contracts";
import { alertColor, assetGlyph, escapeHtml, layerPositions, statusColor } from "./helpers";
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
  fireHotspots,
  focusRequest,
  followTarget,
  incidentSignals,
  layerState,
  layers,
  onAddDrawPoint,
  onOpenAsset,
  selectedAssetTrack,
  visibleAssets,
}: Readonly<{
  basemapMode: "map" | "satellite";
  drawMode: boolean;
  drawPoints: Array<{ lat: number; lon: number }>;
  drawnGeofences: DrawnGeofence[];
  fireHotspots: FireHotspot[];
  focusRequest: FocusRequest | null;
  followTarget: LatLngExpression | null;
  incidentSignals: IncidentSignal[];
  layerState: LayerState;
  layers: GeoLayer[];
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

      {layerState.heatZones
        ? fireHotspots.map((hotspot) => (
            <LeafletCircleMarker
              key={hotspot.id}
              center={[hotspot.lat, hotspot.lon]}
              pathOptions={{
                color: hotspot.confidence >= 80 ? "#ff6b3d" : "#ffb347",
                fillColor: hotspot.confidence >= 80 ? "#ff6b3d" : "#ffb347",
                fillOpacity: 0.9,
                weight: 1,
              }}
              radius={Math.max(5, Math.min(10, 4 + (hotspot.frp / 25)))}
            >
              <Tooltip className={styles.mapTooltip} direction="top">
                BCN/NASA hotspot {hotspot.confidence}% &middot; {hotspot.hoursOld}h
              </Tooltip>
            </LeafletCircleMarker>
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
