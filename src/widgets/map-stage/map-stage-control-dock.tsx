"use client";

import type { CSSProperties } from "react";
import type { Asset } from "@/shared/contracts/operational";
import type { BasemapMode, LayerRow, LayerState, MapLayerRow, VisibilityPreset } from "./types";
import styles from "../map-stage.module.css";

const visibilityPresets: Array<{ key: VisibilityPreset; label: string }> = [
  { key: "operations", label: "Ops" },
  { key: "aviation", label: "Aviation" },
  { key: "risk", label: "Risk" },
  { key: "clean", label: "Clean" },
];

function MapStageLayerPanel({
  basemapMode,
  drawMode,
  drawPointsCount,
  layerRows,
  layerState,
  mapLayerRows,
  onCancelDrawing,
  onClose,
  onFinishGeofence,
  onSetBasemapMode,
  onStartDrawing,
  onApplyVisibilityPreset,
  onToggleMapLayer,
  onToggleLayer,
}: Readonly<{
  basemapMode: BasemapMode;
  drawMode: boolean;
  drawPointsCount: number;
  layerRows: LayerRow[];
  layerState: LayerState;
  mapLayerRows: MapLayerRow[];
  onCancelDrawing: () => void;
  onClose: () => void;
  onFinishGeofence: () => void;
  onSetBasemapMode: (mode: BasemapMode) => void;
  onStartDrawing: () => void;
  onApplyVisibilityPreset: (preset: VisibilityPreset) => void;
  onToggleMapLayer: (layerId: string) => void;
  onToggleLayer: (key: keyof LayerState) => void;
}>) {
  const visibleMapLayerRows = mapLayerRows.filter((row) => row.checked);

  return (
    <section className={styles.layerSelector}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelLabel}>Map layers</span>
          <h2 className={styles.panelTitle}>Selector</h2>
        </div>
        <button className={styles.closeButton} onClick={onClose} type="button">
          Close
        </button>
      </div>

      <div className={styles.basemapSection}>
        <span className={styles.basemapLabel}>Basemap</span>
        <div className={styles.basemapSwitch}>
          <button
            className={`${styles.basemapButton} ${basemapMode === "map" ? styles.basemapButtonActive : ""}`}
            onClick={() => onSetBasemapMode("map")}
            type="button"
          >
            Map
          </button>
          <button
            className={`${styles.basemapButton} ${basemapMode === "satellite" ? styles.basemapButtonActive : ""}`}
            onClick={() => onSetBasemapMode("satellite")}
            type="button"
          >
            Satellite
          </button>
        </div>
      </div>

      <div className={styles.layerSection}>
        <span className={styles.basemapLabel}>Visibility presets</span>
        <div className={styles.presetSwitch}>
          {visibilityPresets.map((preset) => (
            <button
              key={preset.key}
              className={styles.presetButton}
              onClick={() => onApplyVisibilityPreset(preset.key)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.drawSection}>
        <span className={styles.basemapLabel}>Geofence drawing</span>
        <div className={styles.drawActions}>
          <button
            className={`${styles.basemapButton} ${drawMode ? styles.basemapButtonActive : ""}`}
            onClick={onStartDrawing}
            type="button"
          >
            Draw geofence
          </button>
          {drawMode ? (
            <>
              <button
                className={styles.basemapButton}
                disabled={drawPointsCount < 3}
                onClick={onFinishGeofence}
                type="button"
              >
                Finish
              </button>
              <button className={styles.basemapButton} onClick={onCancelDrawing} type="button">
                Cancel
              </button>
            </>
          ) : null}
        </div>
        {drawMode ? (
          <p className={styles.layerHint}>
            Click on the map to add vertices. Finish after at least 3 points.
          </p>
        ) : null}
      </div>

      {mapLayerRows.length > 0 ? (
        <div className={styles.layerSection}>
          <span className={styles.basemapLabel}>Operational overlays</span>
          <div className={styles.layerList}>
            {mapLayerRows.map((row) => (
              <label key={row.id} className={styles.layerRow}>
                <span className={styles.layerText}>
                  <strong>
                    <span
                      aria-hidden="true"
                      className={styles.layerSwatch}
                      style={{ "--layer-color": row.color } as CSSProperties}
                    />
                    {row.title}
                  </strong>
                  <span>{row.meta}</span>
                </span>
                <input
                  checked={row.checked}
                  className={styles.toggle}
                  disabled={row.disabled}
                  onChange={() => onToggleMapLayer(row.id)}
                  type="checkbox"
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.layerSection}>
        <span className={styles.basemapLabel}>Local layers</span>
        <div className={styles.layerList}>
          {layerRows.map((row) => (
            <label key={row.key} className={styles.layerRow}>
              <span className={styles.layerText}>
                <strong>{row.title}</strong>
                <span>{row.meta}</span>
              </span>
              <input
                checked={layerState[row.key]}
                className={styles.toggle}
                onChange={() => onToggleLayer(row.key)}
                type="checkbox"
              />
            </label>
          ))}
        </div>
      </div>

      {visibleMapLayerRows.length > 0 ? (
        <div className={styles.layerSection}>
          <span className={styles.basemapLabel}>Visible legend</span>
          <div className={styles.layerLegend}>
            {visibleMapLayerRows.map((row) => (
              <span key={row.id} className={styles.legendItem}>
                <span
                  aria-hidden="true"
                  className={styles.layerSwatch}
                  style={{ "--layer-color": row.color } as CSSProperties}
                />
                {row.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}

    </section>
  );
}

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
          className={`${styles.surfaceButton} ${isDeviceSidebarOpen ? styles.surfaceButtonActive : ""}`}
          onClick={onToggleDeviceSidebar}
          type="button"
        >
          Devices
        </button>
        <button
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
