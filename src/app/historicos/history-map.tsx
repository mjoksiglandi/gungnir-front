"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { Asset, TrackHistoryPoint } from "@/types/domain";
import { assetIcon } from "@/widgets/map-stage/map-stage-canvas.helpers";
import styles from "./history-workspace.module.css";

function HistoryMapViewport({
  points,
}: Readonly<{
  points: TrackHistoryPoint[];
}>) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView([-33.45, -70.66], 8, { animate: false });
      return;
    }

    if (points.length === 1) {
      const [point] = points;
      map.setView([point.position.lat, point.position.lon], 13, { animate: true });
      return;
    }

    const bounds = points.map((point) => [point.position.lat, point.position.lon] as [number, number]);
    map.fitBounds(bounds, {
      animate: true,
      padding: [48, 48],
    });
  }, [map, points]);

  return null;
}

export function HistoryMap({
  asset,
  points,
}: Readonly<{
  asset: Asset | null;
  points: TrackHistoryPoint[];
}>) {
  const routePositions = points.map((point) => [point.position.lat, point.position.lon] as [number, number]);
  const firstPoint = points[0] ?? null;
  const lastPoint = points[points.length - 1] ?? null;

  return (
    <MapContainer
      attributionControl={false}
      center={[-33.45, -70.66]}
      className={styles.map}
      scrollWheelZoom
      zoom={8}
      zoomControl={false}
    >
      <HistoryMapViewport points={points} />
      <TileLayer
        attribution="&copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        attribution="&copy; Esri"
        opacity={0.22}
        url="https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
      />

      {routePositions.length > 1 ? (
        <Polyline
          pathOptions={{ color: "#53c0ff", dashArray: "6 8", opacity: 0.92, weight: 3 }}
          positions={routePositions}
        />
      ) : null}

      {firstPoint ? (
        <CircleMarker
          center={[firstPoint.position.lat, firstPoint.position.lon]}
          pathOptions={{
            color: "#9cffd4",
            fillColor: "#9cffd4",
            fillOpacity: 0.88,
            opacity: 1,
            weight: 1.5,
          }}
          radius={6}
        >
          <Tooltip className={styles.mapTooltip} direction="top">
            Inicio
          </Tooltip>
        </CircleMarker>
      ) : null}

      {lastPoint && asset ? (
        <Marker icon={assetIcon(asset)} position={[lastPoint.position.lat, lastPoint.position.lon]}>
          <Tooltip className={styles.mapTooltip} direction="top" permanent>
            {asset.callsign}
          </Tooltip>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
