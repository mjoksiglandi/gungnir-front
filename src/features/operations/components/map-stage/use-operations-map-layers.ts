"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { browserApiClient } from "@/lib/api";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import type { GeoJsonFeatureCollection, MapLayerDto } from "@/types/api";
import type { MapLayer } from "@/types/domain";
import { isAllowedMapLayer } from "./helpers";

type SnapshotLayer = MapStageBootstrap["snapshot"]["layers"][number] & {
  confidence?: number;
  featureCollectionUrl?: string;
  metadata?: MapLayerDto["metadata"];
  refreshIntervalSec?: number;
  source?: string;
  ttlSec?: number;
};

const mapLayerSourceTypes = new Set<MapLayerDto["sourceType"]>([
  "internal",
  "external",
  "fire-intel",
  "earthquakes",
  "air-traffic",
  "notams",
  "weather",
]);

const NATURAL_HAZARD_REFRESH_MS = 5 * 60 * 1000;

function naturalHazardLayerDefinitions(): MapLayer[] {
  const now = new Date().toISOString();

  return [
    {
      id: "layer-fire-intel",
      name: "Active Fires",
      layerType: "point",
      sourceType: "fire-intel",
      enabled: false,
      refreshIntervalSec: 300,
      ttlSec: 900,
      lastUpdatedAt: null,
      confidence: 100,
      metadata: {
        provider: "NASA FIRMS",
        dataset: "fires",
        geometryType: "Point",
        style: {
          color: "#ff6b00",
          marker: "fire",
        },
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "layer-earthquakes",
      name: "Earthquakes",
      layerType: "point",
      sourceType: "earthquakes",
      enabled: false,
      refreshIntervalSec: 600,
      ttlSec: 900,
      lastUpdatedAt: null,
      confidence: 100,
      metadata: {
        provider: "USGS",
        dataset: "earthquakes",
        geometryType: "Point",
        style: {
          color: "#ff9500",
          marker: "seismic",
        },
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "layer-weather-hazards",
      name: "Weather Hazards",
      layerType: "point",
      sourceType: "weather",
      enabled: false,
      refreshIntervalSec: 600,
      ttlSec: 900,
      lastUpdatedAt: null,
      confidence: 100,
      metadata: {
        provider: "NASA EONET / NOAA NWS",
        dataset: "weather-hazards",
        geometryType: "Point",
        style: {
          color: "#e040fb",
          marker: "weather",
        },
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function sourceTypeFromSnapshotLayer(layer: SnapshotLayer): MapLayerDto["sourceType"] {
  if (mapLayerSourceTypes.has(layer.source as MapLayerDto["sourceType"])) {
    return layer.source as MapLayerDto["sourceType"];
  }

  if (layer.metadata?.dataset === "notams") {
    return "notams";
  }

  return "internal";
}

function mapLayerFromSnapshotLayer(layer: SnapshotLayer): MapLayer | null {
  const isBackendMapLayer = Boolean(layer.featureCollectionUrl || layer.metadata?.provider || layer.metadata?.dataset);

  if (!isBackendMapLayer) {
    return null;
  }

  return {
    id: layer.id,
    name: layer.name,
    layerType: layer.layerType,
    sourceType: sourceTypeFromSnapshotLayer(layer),
    enabled: layer.visibleByDefault,
    refreshIntervalSec: layer.refreshIntervalSec ?? 0,
    ttlSec: layer.ttlSec ?? 0,
    lastUpdatedAt: layer.updatedAt,
    confidence: layer.confidence ?? 100,
    featureCollectionUrl: layer.featureCollectionUrl,
    metadata: layer.metadata ?? {},
    createdAt: layer.updatedAt,
    updatedAt: layer.updatedAt,
  };
}

function mapLayersFromSnapshotLayers(layers: SnapshotLayer[]) {
  return layers
    .map((layer) => mapLayerFromSnapshotLayer(layer))
    .filter((layer): layer is MapLayer => Boolean(layer))
    .filter(isAllowedMapLayer);
}

function loadCompatibilityMapLayers() {
  return fetch("/api/v1/layers", {
    cache: "no-store",
    credentials: "same-origin",
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Could not load compatibility map layers (${response.status}).`);
    }

    return mapLayersFromSnapshotLayers(await response.json() as SnapshotLayer[]);
  });
}

export function withNaturalHazardLayers(layers: MapLayer[]) {
  const byId = new Map(layers.map((layer) => [layer.id, layer]));

  for (const layer of naturalHazardLayerDefinitions()) {
    if (!byId.has(layer.id)) {
      byId.set(layer.id, layer);
    }
  }

  return Array.from(byId.values());
}

export function mapLayersFromBootstrap(bootstrap: MapStageBootstrap) {
  return mapLayersFromSnapshotLayers(bootstrap.snapshot.layers as SnapshotLayer[]);
}

export async function loadMapLayers(): Promise<MapLayer[]> {
  try {
    return withNaturalHazardLayers((await browserApiClient.get<MapLayerDto[]>("/map-layers")).filter(isAllowedMapLayer));
  } catch {
    return withNaturalHazardLayers(await loadCompatibilityMapLayers());
  }
}

async function loadMapLayerFeatureCollection(layer: MapLayer) {
  if (layer.featureCollectionUrl?.startsWith("/api/")) {
    const response = await fetch(layer.featureCollectionUrl, {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`Could not load map layer '${layer.id}' (${response.status}).`);
    }

    return await response.json() as GeoJsonFeatureCollection;
  }

  return browserApiClient.get<GeoJsonFeatureCollection>(`/map-layers/${layer.id}/geojson`);
}

function mergeMapLayers(currentLayers: MapLayer[], nextLayers: MapLayer[]) {
  const currentById = new Map(currentLayers.map((layer) => [layer.id, layer]));

  return nextLayers.map((layer) => {
    const currentLayer = currentById.get(layer.id);

    return {
      ...layer,
      featureCollection: currentLayer?.featureCollection,
      featureCollectionLoadedAt: currentLayer?.featureCollectionLoadedAt,
    };
  });
}

export function useOperationsMapLayers(initialBootstrap: MapStageBootstrap) {
  const [mapLayers, setMapLayers] = useState<MapLayer[]>(() =>
    withNaturalHazardLayers(mapLayersFromBootstrap(initialBootstrap)),
  );
  const [mapLayerLoadingIds, setMapLayerLoadingIds] = useState<string[]>([]);
  const mapLayersRef = useRef(mapLayers);
  const mapLayerLoadingIdsRef = useRef(mapLayerLoadingIds);

  useEffect(() => {
    mapLayersRef.current = mapLayers;
  }, [mapLayers]);

  useEffect(() => {
    mapLayerLoadingIdsRef.current = mapLayerLoadingIds;
  }, [mapLayerLoadingIds]);

  const replaceMapLayers = useCallback((nextLayers: MapLayer[]) => {
    setMapLayers((current) => mergeMapLayers(current, nextLayers));
  }, []);

  const refreshMapLayers = useCallback(async () => {
    replaceMapLayers(await loadMapLayers());
  }, [replaceMapLayers]);

  const ensureMapLayerFeatureCollection = useCallback(async (layerId: string) => {
    const layer = mapLayersRef.current.find((candidate) => candidate.id === layerId);
    const loadedAt = layer?.featureCollectionLoadedAt ?? 0;
    const refreshMs = Math.max(
      NATURAL_HAZARD_REFRESH_MS,
      (layer?.refreshIntervalSec ?? 0) * 1000,
    );
    const isFresh = Boolean(layer?.featureCollection) && Date.now() - loadedAt < refreshMs;

    if (!layer || isFresh || mapLayerLoadingIdsRef.current.includes(layerId)) {
      return;
    }

    setMapLayerLoadingIds((current) => current.includes(layerId) ? current : [...current, layerId]);

    try {
      const featureCollection = await loadMapLayerFeatureCollection(layer);
      setMapLayers((current) => current.map((candidate) => candidate.id === layerId
        ? {
            ...candidate,
            featureCollection,
            featureCollectionLoadedAt: Date.now(),
          }
        : candidate));
    } finally {
      setMapLayerLoadingIds((current) => current.filter((id) => id !== layerId));
    }
  }, []);

  const isMapLayerLoading = useCallback((layerId: string) => {
    return mapLayerLoadingIdsRef.current.includes(layerId);
  }, []);

  return {
    ensureMapLayerFeatureCollection,
    isMapLayerLoading,
    mapLayerLoadingIds,
    mapLayers,
    refreshMapLayers,
    replaceMapLayers,
  };
}
