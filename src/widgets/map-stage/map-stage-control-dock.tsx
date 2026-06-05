"use client";

import type { Asset } from "@/shared/contracts/operational";
import { MapStageLayerPanel } from "./map-stage-layer-panel";
import type { BasemapMode, LayerRow, LayerState, MapLayerRow, VisibilityPreset } from "./types";
import styles from "../map-stage.module.css";
export function MapStageControlDock({
  basemapMode,
  drawMode,
  drawPointsCount,
  isDeviceSidebarOpen,
  layerRows,
  layerState,
  mapLayerRows,
  selectedAsset,
  showLayerPanel,
  onCancelDrawing,
  onClearFocus,
  onFinishGeofence,
  onSetBasemapMode,
  onStartDrawing,
  onApplyVisibilityPreset,
  onToggleMapLayer,
  onToggleDeviceSidebar,
  onToggleLayer,
  onToggleLayerPanel,
}: Readonly<{
  basemapMode: BasemapMode;
  drawMode: boolean;
  drawPointsCount: number;
  isDeviceSidebarOpen: boolean;
  layerRows: LayerRow[];
  layerState: LayerState;
  mapLayerRows: MapLayerRow[];
  selectedAsset: Asset | null;
  showLayerPanel: boolean;
  onCancelDrawing: () => void;
  onClearFocus: () => void;
  onFinishGeofence: () => void;
  onSetBasemapMode: (mode: BasemapMode) => void;
  onStartDrawing: () => void;
  onApplyVisibilityPreset: (preset: VisibilityPreset) => void;
  onToggleMapLayer: (layerId: string) => void;
  onToggleDeviceSidebar: () => void;
  onToggleLayer: (key: keyof LayerState) => void;
  onToggleLayerPanel: () => void;
}>) {
  return (
    <div className={styles.controlDock}>
      <div className={styles.quickDock}>
        <button
          aria-controls="device-sidebar"
          aria-expanded={isDeviceSidebarOpen}
          className={`${styles.surfaceButton} ${isDeviceSidebarOpen ? styles.surfaceButtonActive : ""}`}
          onClick={onToggleDeviceSidebar}
          type="button"
        >
          Devices
        </button>
        <button
          aria-controls="layer-panel"
          aria-expanded={showLayerPanel}
          className={`${styles.surfaceButton} ${showLayerPanel ? styles.surfaceButtonActive : ""}`}
          onClick={onToggleLayerPanel}
          type="button"
        >
          Layers
        </button>
        {selectedAsset ? (
          <button className={styles.surfaceGhost} onClick={onClearFocus} type="button">
            Clear focus
          </button>
        ) : null}
      </div>

      {showLayerPanel ? (
        <MapStageLayerPanel
          basemapMode={basemapMode}
          drawMode={drawMode}
          drawPointsCount={drawPointsCount}
          layerRows={layerRows}
          layerState={layerState}
          mapLayerRows={mapLayerRows}
          onCancelDrawing={onCancelDrawing}
          onClose={onToggleLayerPanel}
          onFinishGeofence={onFinishGeofence}
          onSetBasemapMode={onSetBasemapMode}
          onStartDrawing={onStartDrawing}
          onApplyVisibilityPreset={onApplyVisibilityPreset}
          onToggleMapLayer={onToggleMapLayer}
          onToggleLayer={onToggleLayer}
        />
      ) : null}
    </div>
  );
}
