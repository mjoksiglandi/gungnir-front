"use client";

import type { Asset } from "@/shared/contracts/operational";
import type { FireHotspotLayer } from "@/shared/geospatial/contracts";
import type { BasemapMode, LayerRow, LayerState } from "./types";
import styles from "../map-stage.module.css";

function MapStageLayerPanel({
  basemapMode,
  drawMode,
  drawPointsCount,
  fireHotspotLayer,
  layerRows,
  layerState,
  onCancelDrawing,
  onClose,
  onFinishGeofence,
  onSetBasemapMode,
  onStartDrawing,
  onToggleLayer,
}: Readonly<{
  basemapMode: BasemapMode;
  drawMode: boolean;
  drawPointsCount: number;
  fireHotspotLayer: FireHotspotLayer;
  layerRows: LayerRow[];
  layerState: LayerState;
  onCancelDrawing: () => void;
  onClose: () => void;
  onFinishGeofence: () => void;
  onSetBasemapMode: (mode: BasemapMode) => void;
  onStartDrawing: () => void;
  onToggleLayer: (key: keyof LayerState) => void;
}>) {
  const fireHotspotIssue = fireHotspotLayer.issues[0];

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

      <p className={styles.layerHint}>
        Fire hotspot feed normalized from external providers with central timeout and error policy.
      </p>
      <p className={styles.layerHint}>
        Feed status: {fireHotspotLayer.status}
        {fireHotspotIssue ? ` (${fireHotspotIssue.message})` : ""}
      </p>
    </section>
  );
}

export function MapStageControlDock({
  basemapMode,
  drawMode,
  drawPointsCount,
  fireHotspotLayer,
  isDeviceSidebarOpen,
  layerRows,
  layerState,
  selectedAsset,
  showLayerPanel,
  onCancelDrawing,
  onClearFocus,
  onFinishGeofence,
  onSetBasemapMode,
  onStartDrawing,
  onToggleDeviceSidebar,
  onToggleLayer,
  onToggleLayerPanel,
}: Readonly<{
  basemapMode: BasemapMode;
  drawMode: boolean;
  drawPointsCount: number;
  fireHotspotLayer: FireHotspotLayer;
  isDeviceSidebarOpen: boolean;
  layerRows: LayerRow[];
  layerState: LayerState;
  selectedAsset: Asset | null;
  showLayerPanel: boolean;
  onCancelDrawing: () => void;
  onClearFocus: () => void;
  onFinishGeofence: () => void;
  onSetBasemapMode: (mode: BasemapMode) => void;
  onStartDrawing: () => void;
  onToggleDeviceSidebar: () => void;
  onToggleLayer: (key: keyof LayerState) => void;
  onToggleLayerPanel: () => void;
}>) {
  const fireHotspotIssue = fireHotspotLayer.issues[0];

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

      {fireHotspotLayer.status !== "ready" ? (
        <section className={styles.feedStatusBanner} aria-live="polite">
          <strong>Hotspot feed {fireHotspotLayer.status}</strong>
          <span>{fireHotspotIssue?.message ?? "External hotspot data is temporarily unavailable."}</span>
        </section>
      ) : null}

      {showLayerPanel ? (
        <MapStageLayerPanel
          basemapMode={basemapMode}
          drawMode={drawMode}
          drawPointsCount={drawPointsCount}
          fireHotspotLayer={fireHotspotLayer}
          layerRows={layerRows}
          layerState={layerState}
          onCancelDrawing={onCancelDrawing}
          onClose={onToggleLayerPanel}
          onFinishGeofence={onFinishGeofence}
          onSetBasemapMode={onSetBasemapMode}
          onStartDrawing={onStartDrawing}
          onToggleLayer={onToggleLayer}
        />
      ) : null}
    </div>
  );
}
