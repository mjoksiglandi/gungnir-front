"use client";

import { useEffect, useMemo, useRef } from "react";
import type { FeatureCollection } from "geojson";
import type { LatLngExpression } from "leaflet";
import maplibregl, { type GeoJSONSource, type StyleSpecification } from "maplibre-gl";
import type { Asset } from "@/shared/contracts/operational";
import type { MapLayer } from "@/types/domain";
import {
  buildGroundAssetCollection,
  buildTerrainEventCollection,
  fitTerrainEvents,
  initialCenterTuple,
} from "./map-stage-canvas.helpers";
import type { FocusRequest, IncidentSignal, InitialMapView } from "./types";
import styles from "../map-stage.module.css";

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

export function Terrain3DMap({
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
  const terrainEventsRef = useRef<FeatureCollection>(terrainEvents);

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
      center: [lon, lat],
      container: containerRef.current,
      pitch: 62,
      style: terrainStyle,
      zoom: initialView.zoom,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");

    map.on("load", () => {
      map.addSource("ground-assets", {
        type: "geojson",
        data: buildGroundAssetCollection(groundAssetsRef.current),
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
