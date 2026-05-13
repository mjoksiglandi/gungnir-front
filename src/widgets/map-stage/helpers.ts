import type { Alert, Asset, GeoLayer } from "@/shared/contracts/operational";
import type { LatLngExpression } from "leaflet";
import type { AssetTrackPoint, IncidentSignal, LayerState } from "./types";

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
    groundTraffic: true,
    incidents: true,
    routes: false,
    geofences: geofencesVisible,
    heatZones: false,
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
