"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { Asset } from "@/shared/contracts/operational";
import type { BasemapMode, LayerRow, LayerState, MapLayerRow, VisibilityPreset } from "./types";
import { CollapsiblePanel, TacticalSwitch } from "./map-stage-panel-primitives";
import styles from "../map-stage.module.css";

const visibilityPresets: Array<{ key: VisibilityPreset; label: string }> = [
  { key: "operations", label: "Ops" },
  { key: "aviation", label: "Aviation" },
  { key: "risk", label: "Risk" },
  { key: "clean", label: "Clean" },
];

function SectionStatus({
  active,
  total,
}: Readonly<{
  active: number;
  total: number;
}>) {
  return (
    <span className={styles.sectionStatus}>
      {active}/{total}
    </span>
  );
}

function StaticLayerSection({
  children,
  meta,
  title,
}: Readonly<{
  children: ReactNode;
  meta: string;
  title: string;
}>) {
  return (
    <section className={styles.staticLayerSection}>
      <div className={styles.staticLayerHeader}>
        <div className={styles.staticLayerHeading}>
          <span className={styles.collapsibleTitle}>{title}</span>
          <span className={styles.collapsibleMeta}>{meta}</span>
        </div>
      </div>
      <div className={styles.staticLayerBody}>{children}</div>
    </section>
  );
}

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
  const [openSection, setOpenSection] = useState<string | null>("tracking");
  const visibleMapLayerRows = mapLayerRows.filter((row) => row.checked);
  const naturalHazardRows = mapLayerRows.filter((row) => row.group === "naturalHazards");
  const operationalRows = mapLayerRows.filter((row) => row.group === "operational");
  const trafficLayerRows = layerRows.filter((row) => ["airTraffic", "groundTraffic", "routes"].includes(row.key));
  const contextLayerRows = layerRows.filter((row) => ["incidents", "geofences", "heatZones", "labels"].includes(row.key));
  const activeNaturalHazards = naturalHazardRows.filter((row) => row.checked).length + (layerState.dayNight ? 1 : 0);
  const naturalHazardTotal = naturalHazardRows.length + 1;
  const activeOperationalRows = operationalRows.filter((row) => row.checked).length;
  const activeTrafficRows = trafficLayerRows.filter((row) => layerState[row.key]).length;
  const activeContextRows = contextLayerRows.filter((row) => layerState[row.key]).length;
  const allNaturalHazardsChecked = naturalHazardRows.every((row) => row.checked) && layerState.dayNight;
  const allOperationalRowsChecked = operationalRows.every((row) => row.checked);
  const allTrafficRowsChecked = trafficLayerRows.every((row) => layerState[row.key]);
  const allContextRowsChecked = contextLayerRows.every((row) => layerState[row.key]);

  function setMapLayerGroup(rows: MapLayerRow[], nextChecked: boolean) {
    rows.forEach((row) => {
      if (!row.disabled && row.checked !== nextChecked) {
        onToggleMapLayer(row.id);
      }
    });
  }

  function setLocalLayerGroup(rows: LayerRow[], nextChecked: boolean) {
    rows.forEach((row) => {
      if (layerState[row.key] !== nextChecked) {
        onToggleLayer(row.key);
      }
    });
  }

  return (
    <section className={styles.layerSelector} id="layer-panel">
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelLabel}>Data Layers</span>
          <h2 className={styles.panelTitle}>Operational overlays</h2>
        </div>
        <button className={styles.closeButton} onClick={onClose} type="button">
          Close
        </button>
      </div>

      <StaticLayerSection meta={basemapMode.toUpperCase()} title="Basemap">
        <div className={styles.basemapSection}>
          <div className={styles.basemapSwitch}>
            <button
              className={`${styles.basemapButton} ${basemapMode === "map" ? styles.basemapButtonActive : ""}`}
              onClick={() => onSetBasemapMode("map")}
              type="button"
            >
              Relief
            </button>
            <button
              className={`${styles.basemapButton} ${basemapMode === "satellite" ? styles.basemapButtonActive : ""}`}
              onClick={() => onSetBasemapMode("satellite")}
              type="button"
            >
              Satellite
            </button>
            <button
              className={`${styles.basemapButton} ${basemapMode === "terrain3d" ? styles.basemapButtonActive : ""}`}
              onClick={() => onSetBasemapMode("terrain3d")}
              type="button"
            >
              3D
            </button>
          </div>
        </div>
      </StaticLayerSection>

      <StaticLayerSection meta={`${visibilityPresets.length} presets`} title="Presets">
        <div className={styles.layerSection}>
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
      </StaticLayerSection>

      <CollapsiblePanel
        meta={drawMode ? `${drawPointsCount} pts` : "Ready"}
        onOpenChange={(open) => setOpenSection(open ? "geofences" : null)}
        open={openSection === "geofences"}
        title="Geofences"
      >
        <div className={styles.drawSection}>
          <div className={styles.drawActions}>
            <button
              className={`${styles.basemapButton} ${drawMode ? styles.basemapButtonActive : ""}`}
              onClick={onStartDrawing}
              type="button"
            >
              Draw
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
      </CollapsiblePanel>

      {naturalHazardRows.length > 0 ? (
        <CollapsiblePanel
          control={(
            <TacticalSwitch
              checked={allNaturalHazardsChecked}
              label={allNaturalHazardsChecked ? "Disable all natural hazard layers" : "Enable all natural hazard layers"}
              onChange={() => {
                setMapLayerGroup(naturalHazardRows, !allNaturalHazardsChecked);
                if (layerState.dayNight === allNaturalHazardsChecked) {
                  onToggleLayer("dayNight");
                }
              }}
            />
          )}
          meta={<SectionStatus active={activeNaturalHazards} total={naturalHazardTotal} />}
          onOpenChange={(open) => setOpenSection(open ? "natural-hazards" : null)}
          open={openSection === "natural-hazards"}
          title="Natural Hazards"
        >
          <div className={styles.layerSection}>
            <div className={styles.hazardLayerList}>
              {naturalHazardRows.map((row) => (
                <label key={row.id} className={styles.hazardLayerRow}>
                  <span
                    aria-hidden="true"
                    className={styles.layerSwatch}
                    style={{ "--layer-color": row.color } as CSSProperties}
                  />
                  <span aria-hidden="true" className={styles.hazardIcon} style={{ "--layer-color": row.color } as CSSProperties}>
                    {row.icon}
                  </span>
                  <span className={styles.hazardLayerText}>
                    <strong>{row.title}</strong>
                    {row.periodLabel ? <span>{row.periodLabel}</span> : null}
                  </span>
                  <span className={styles.hazardCount} style={{ "--layer-color": row.color } as CSSProperties}>
                    {row.disabled ? "..." : row.countLabel}
                  </span>
                  <TacticalSwitch
                    checked={row.checked}
                    disabled={row.disabled}
                    label={`${row.checked ? "Hide" : "Show"} ${row.title}`}
                    onChange={() => onToggleMapLayer(row.id)}
                  />
                </label>
              ))}
              <label className={styles.hazardLayerRow}>
                <span
                  aria-hidden="true"
                  className={styles.layerSwatch}
                  style={{ "--layer-color": "#448aff" } as CSSProperties}
                />
                <span aria-hidden="true" className={styles.hazardIcon} style={{ "--layer-color": "#448aff" } as CSSProperties}>
                  D
                </span>
                <span className={styles.hazardLayerText}>
                  <strong>Day/Night</strong>
                  <span>5 min</span>
                </span>
                <span className={styles.hazardCount} style={{ "--layer-color": "#448aff" } as CSSProperties}>1</span>
                <TacticalSwitch
                  checked={layerState.dayNight}
                  label={layerState.dayNight ? "Hide day and night overlay" : "Show day and night overlay"}
                  onChange={() => onToggleLayer("dayNight")}
                />
              </label>
            </div>
          </div>
        </CollapsiblePanel>
      ) : null}

      {operationalRows.length > 0 ? (
        <CollapsiblePanel
          control={(
            <TacticalSwitch
              checked={allOperationalRowsChecked}
              label={allOperationalRowsChecked ? "Disable all operational feeds" : "Enable all operational feeds"}
              onChange={() => setMapLayerGroup(operationalRows, !allOperationalRowsChecked)}
            />
          )}
          meta={<SectionStatus active={activeOperationalRows} total={operationalRows.length} />}
          onOpenChange={(open) => setOpenSection(open ? "operational-feeds" : null)}
          open={openSection === "operational-feeds"}
          title="Operational Feeds"
        >
          <div className={styles.layerList}>
            {operationalRows.map((row) => (
              <label key={row.id} className={styles.layerRow}>
                <span className={styles.layerText}>
                  <strong>
                    <span
                      aria-hidden="true"
                      className={styles.layerSwatch}
                      style={{ "--layer-color": row.color } as CSSProperties}
                    />
                    <span aria-hidden="true" className={styles.layerGlyph}>{row.icon}</span>
                    {row.title}
                  </strong>
                  <span>{row.meta}</span>
                </span>
                <TacticalSwitch
                  checked={row.checked}
                  disabled={row.disabled}
                  label={`${row.checked ? "Hide" : "Show"} ${row.title}`}
                  onChange={() => onToggleMapLayer(row.id)}
                />
              </label>
            ))}
          </div>
        </CollapsiblePanel>
      ) : null}

      <CollapsiblePanel
        control={(
          <TacticalSwitch
            checked={allTrafficRowsChecked}
            label={allTrafficRowsChecked ? "Disable all tracking layers" : "Enable all tracking layers"}
            onChange={() => setLocalLayerGroup(trafficLayerRows, !allTrafficRowsChecked)}
          />
        )}
        meta={<SectionStatus active={activeTrafficRows} total={trafficLayerRows.length} />}
        onOpenChange={(open) => setOpenSection(open ? "tracking" : null)}
        open={openSection === "tracking"}
        title="Tracking"
      >
        <div className={styles.layerList}>
          {trafficLayerRows.map((row) => (
            <label key={row.key} className={styles.layerRow}>
              <span className={styles.layerText}>
                <strong>{row.title}</strong>
                <span>{row.meta}</span>
              </span>
              <TacticalSwitch
                checked={layerState[row.key]}
                label={`${layerState[row.key] ? "Hide" : "Show"} ${row.title}`}
                onChange={() => onToggleLayer(row.key)}
              />
            </label>
          ))}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        control={(
          <TacticalSwitch
            checked={allContextRowsChecked}
            label={allContextRowsChecked ? "Disable all context layers" : "Enable all context layers"}
            onChange={() => setLocalLayerGroup(contextLayerRows, !allContextRowsChecked)}
          />
        )}
        meta={<SectionStatus active={activeContextRows} total={contextLayerRows.length} />}
        onOpenChange={(open) => setOpenSection(open ? "context" : null)}
        open={openSection === "context"}
        title="Context"
      >
        <div className={styles.layerList}>
          {contextLayerRows.map((row) => (
            <label key={row.key} className={styles.layerRow}>
              <span className={styles.layerText}>
                <strong>{row.title}</strong>
                <span>{row.meta}</span>
              </span>
              <TacticalSwitch
                checked={layerState[row.key]}
                label={`${layerState[row.key] ? "Hide" : "Show"} ${row.title}`}
                onChange={() => onToggleLayer(row.key)}
              />
            </label>
          ))}
        </div>
      </CollapsiblePanel>

      {visibleMapLayerRows.length > 0 ? (
        <CollapsiblePanel
          meta={`${visibleMapLayerRows.length} live`}
          onOpenChange={(open) => setOpenSection(open ? "visible-legend" : null)}
          open={openSection === "visible-legend"}
          title="Visible Legend"
        >
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
        </CollapsiblePanel>
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
