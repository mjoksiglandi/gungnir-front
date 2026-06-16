"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { GeoJsonObject } from "geojson";
import type { LatLngExpression } from "leaflet";
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
import { alertColor, getFeatureLabel, getFeaturePopupLines, layerPositions } from "./helpers";
import {
  assetIcon,
  bindFeaturePopup,
  buildNightPolygons,
  earthquakeColor,
  earthquakeRadius,
  getMapLayerRadiusMeters,
  getPointCoordinates,
  incidentIcon,
  isNaturalHazardLayer,
  mapLayerColor,
  mapLayerGeoJsonStyle,
  mapLayerMarkerGlyph,
  naturalHazardColor,
  naturalHazardLabel,
  naturalHazardRadius,
  popupEntriesFromLines,
  resolveMapLayerPointIcon,
  shouldShowNaturalHazardLabel,
  wildfireColor,
  wildfireRadius,
} from "./map-stage-canvas.helpers";
import { HazardPopup, InfoPopup } from "./map-stage-canvas-popups";
import { Terrain3DMap } from "./map-stage-terrain-map";
import type { BasemapMode, DrawnGeofence, FocusRequest, IncidentSignal, InitialMapView, LayerState } from "./types";
import styles from "../map-stage.module.css";

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
                const coordinates = getPointCoordinates(feature as GeoJsonFeature);
                if (!coordinates) {
                  return null;
                }

                const popupTitle = getFeatureLabel(feature as GeoJsonFeature) ?? layer.name;
                const popupLines = getFeaturePopupLines(feature as GeoJsonFeature);
                const popupEntries = popupEntriesFromLines(popupLines).map((entry) => [entry.label, entry.value] as const);
                const radiusMeters = getMapLayerRadiusMeters(layer, feature as GeoJsonFeature);
                const isNaturalHazard = isNaturalHazardLayer(layer);
                const hazardColor = naturalHazardColor((feature as GeoJsonFeature).properties, mapLayerColor(layer));

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
                        radius={naturalHazardRadius(layer, feature as GeoJsonFeature)}
                      >
                        <Popup>
                          <HazardPopup coordinates={coordinates} feature={feature as GeoJsonFeature} layer={layer} />
                        </Popup>
                        {shouldShowNaturalHazardLabel(layer, feature as GeoJsonFeature) ? (
                          <Tooltip className={styles.mapTooltip} direction="top" permanent>
                            {naturalHazardLabel(layer, feature as GeoJsonFeature)}
                          </Tooltip>
                        ) : null}
                      </LeafletCircleMarker>
                    ) : (
                      <Marker icon={resolveMapLayerPointIcon(layer)} position={coordinates}>
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
                        {layerState.labels ? (
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
              <Marker icon={incidentIcon(signal.severity)} position={[signal.anchorLat, signal.anchorLon]}>
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
