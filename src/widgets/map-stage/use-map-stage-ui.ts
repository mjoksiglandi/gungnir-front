"use client";

import type { Alert, Asset, GeoLayer } from "@/shared/contracts/operational";
import type { MapLayer } from "@/types/domain";
import type {
  AssetTrackPoint,
} from "./types";
import { useMapStageDrawing } from "./use-map-stage-drawing";
import { useMapStageFocus } from "./use-map-stage-focus";
import { useMapStageVisibility } from "./use-map-stage-visibility";

export function useMapStageUi({
  alerts,
  assetTracks,
  assets,
  clearSelection,
  layers,
  mapLayers,
  onMapLayerShown,
  selectedAsset,
  initialLayersParam,
}: Readonly<{
  alerts: Alert[];
  assetTracks: Record<string, AssetTrackPoint[]>;
  assets: Asset[];
  clearSelection: () => void;
  initialLayersParam: string | null;
  layers: GeoLayer[];
  mapLayers: MapLayer[];
  onMapLayerShown: (layerId: string) => Promise<void>;
  selectedAsset: Asset | null;
}>) {
  const drawing = useMapStageDrawing();
  const focus = useMapStageFocus({
    assetTracks,
    assets,
    clearSelection,
    selectedAsset,
  });
  const visibility = useMapStageVisibility({
    alerts,
    assets,
    initialLayersParam,
    layers,
    mapLayers,
    onMapLayerShown,
    selectedAsset,
  });

  return {
    ...drawing,
    ...focus,
    ...visibility,
  };
}
