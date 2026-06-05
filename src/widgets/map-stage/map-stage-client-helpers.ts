import type { ReadonlyURLSearchParams } from "next/navigation";
import type { Alert, Asset, Incident } from "@/shared/contracts/operational";
import type { EarthquakeLayer, FireHotspotLayer } from "@/shared/geospatial/contracts";
import type { MapLayer } from "@/types/domain";
import type { InitialMapView, LayerRow, MapLayerRow } from "./types";

const DEFAULT_MAP_CENTER: [number, number] = [-33.454, -70.655];
const DEFAULT_MAP_ZOOM = 11;
const MIN_MAP_ZOOM = 2;
const MAX_MAP_ZOOM = 18;

export type AssetCounts = {
  air: number;
  ground: number;
  personnel: number;
  maritime: number;
};

export function createInitialMapView(searchParams: Pick<ReadonlyURLSearchParams, "get">): InitialMapView {
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const zoom = Number(searchParams.get("zoom"));

  return {
    center: [
      Number.isFinite(lat) ? lat : DEFAULT_MAP_CENTER[0],
      Number.isFinite(lon) ? lon : DEFAULT_MAP_CENTER[1],
    ],
    zoom: Number.isFinite(zoom) ? Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, zoom)) : DEFAULT_MAP_ZOOM,
  };
}

export function buildAssetCounts(assets: Asset[]): AssetCounts {
  return assets.reduce<AssetCounts>((counts, asset) => {
    if (asset.assetType === "air") {
      counts.air += 1;
      return counts;
    }

    if (asset.assetType === "ground") {
      counts.ground += 1;
      return counts;
    }

    if (asset.assetType === "personnel") {
      counts.personnel += 1;
      return counts;
    }

    counts.maritime += 1;
    return counts;
  }, {
    air: 0,
    ground: 0,
    personnel: 0,
    maritime: 0,
  });
}

export function buildLayerRows({
  assetCounts,
  drawnGeofenceCount,
  earthquakeCount,
  geofenceLayerCount,
  incidentSignalCount,
  selectedAssetTrackCount,
  showRoutes,
  wildfireCount,
}: Readonly<{
  assetCounts: AssetCounts;
  drawnGeofenceCount: number;
  earthquakeCount: number;
  geofenceLayerCount: number;
  incidentSignalCount: number;
  selectedAssetTrackCount: number;
  showRoutes: boolean;
  wildfireCount: number;
}>): LayerRow[] {
  const groundUnitCount = assetCounts.ground + assetCounts.personnel + assetCounts.maritime;

  return [
    { key: "airTraffic", title: "Air disp", meta: `${assetCounts.air} tracks` },
    { key: "earthquakes", title: "Earthquakes", meta: `${earthquakeCount} USGS events` },
    { key: "groundTraffic", title: "Ground traffic", meta: `${groundUnitCount} units` },
    { key: "incidents", title: "Incidents & alerts", meta: `${incidentSignalCount} local signals` },
    { key: "wildfires", title: "Wildfires", meta: `${wildfireCount} FIRMS hotspots` },
    {
      key: "routes",
      title: "Route mode",
      meta: showRoutes ? `${selectedAssetTrackCount} track points` : "select a device",
    },
    { key: "geofences", title: "Geofences", meta: `${geofenceLayerCount + drawnGeofenceCount} zones` },
    { key: "labels", title: "Labels", meta: "map annotations" },
  ];
}

export function decorateMapLayerRows(
  mapLayerRows: MapLayerRow[],
  isMapLayerLoading: (layerId: string) => boolean,
): MapLayerRow[] {
  return mapLayerRows.map((row) => {
    const isLoading = isMapLayerLoading(row.id);

    return {
      ...row,
      disabled: isLoading,
      meta: isLoading ? `${row.meta} - loading` : row.meta,
    };
  });
}

export function getVisibleHazardData(
  visibleMapLayers: MapLayer[],
  earthquakes: EarthquakeLayer | null,
  fireHotspots: FireHotspotLayer | null,
) {
  const visibleMapLayerIds = new Set(visibleMapLayers.map((layer) => layer.id));

  return {
    visibleEarthquakes: visibleMapLayerIds.has("layer-earthquakes")
      ? (earthquakes?.events ?? [])
      : [],
    visibleFireHotspots: visibleMapLayerIds.has("layer-fire-intel")
      ? (fireHotspots?.hotspots ?? [])
      : [],
  };
}

export function getRelatedAlerts(alerts: Alert[], assetId: string): Alert[] {
  return alerts.filter((alert) => alert.assetId === assetId);
}

export function getRelatedIncidents(incidents: Incident[], assetId: string): Incident[] {
  return incidents.filter((incident) => incident.assetIds.includes(assetId));
}
