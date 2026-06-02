"use client";

import { useState, type CSSProperties } from "react";
import type { Asset } from "@/shared/contracts/operational";
import type { BasemapMode, LayerRow, LayerState, MapLayerRow, VisibilityPreset } from "./types";
import { TacticalSwitch } from "./map-stage-panel-primitives";
import styles from "../map-stage.module.css";

const visibilityPresets: Array<{ key: VisibilityPreset; label: string }> = [
  { key: "operations", label: "Ops" },
  { key: "aviation", label: "Aviation" },
  { key: "risk", label: "Risk" },
  { key: "clean", label: "Clean" },
];

type LayerPanelSectionKey =
  | "basemap"
  | "presets"
  | "geofences"
  | "natural-hazards"
  | "operational-feeds"
  | "tracking"
  | "context"
  | "visible-legend";

function compactOperationalTitle(title: string, layerId: string) {
  const normalized = title.trim().toUpperCase();

  if (normalized.includes("NOTAM")) {
    return "NOTAMS";
  }

  if (normalized.includes("AERODROME")) {
    return "AERODROMES";
  }

  if (normalized.includes("FIRE")) {
    return "ACTIVE FIRES";
  }

  if (normalized.includes("EARTHQUAKE")) {
    return "EARTHQUAKES";
  }

  if (normalized.includes("WEATHER")) {
    return "SEVERE WEATHER";
  }

  if (layerId === "day_night") {
    return "DAY/NIGHT";
  }

  return normalized
    .replace(/^DGAC\s+/g, "")
    .replace(/\bGEOREFERENCED\b/g, "")
    .replace(/\bGEOREFERENCED\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactOperationalMeta(meta: string, title: string) {
  const normalizedTitle = title.trim().toUpperCase();
  const normalizedMeta = meta.trim().toUpperCase();

  if (normalizedMeta.includes("NOT LOADED")) {
    return "NOT LOADED";
  }

  if (normalizedMeta.includes("ITEM")) {
    return "";
  }

  return normalizedMeta
    .replace(normalizedTitle, "")
    .replace(/^DGAC\s+/g, "")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactLayerMetric(raw: string) {
  const normalized = raw.trim().toUpperCase();

  if (!normalized || normalized === "...") {
    return "--";
  }

  return normalized
    .replace(/\s+ITEMS?/g, " ITEMS")
    .replace(/\s+/g, " ")
    .trim();
}

function compactHazardMeta(periodLabel?: string | null) {
  if (!periodLabel) {
    return "";
  }

  const normalized = periodLabel.trim().toUpperCase();

  if (normalized === "24H" || normalized === "5 MIN") {
    return "";
  }

  return normalized;
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
  const [activeSection, setActiveSection] = useState<LayerPanelSectionKey>("natural-hazards");
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
  const hasVisibleLegend = visibleMapLayerRows.length > 0;

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

  const sections: Array<{
    key: LayerPanelSectionKey;
    label: string;
    tone?: "accent" | "info";
    meta: string;
    visible?: boolean;
  }> = [
    { key: "basemap", label: "Display", tone: "info", meta: basemapMode === "terrain3d" ? "3D" : basemapMode },
    { key: "presets", label: "Presets", meta: `${visibilityPresets.length}` },
    { key: "geofences", label: "Geofences", meta: drawMode ? `${drawPointsCount} pts` : "Ready" },
    { key: "natural-hazards", label: "Hazard", tone: "accent", meta: `${activeNaturalHazards}/${naturalHazardTotal}` },
    { key: "operational-feeds", label: "Intel", meta: `${activeOperationalRows}/${operationalRows.length}`, visible: operationalRows.length > 0 },
    { key: "tracking", label: "Aviation", meta: `${activeTrafficRows}/${trafficLayerRows.length}` },
    { key: "context", label: "Threat", meta: `${activeContextRows}/${contextLayerRows.length}` },
    { key: "visible-legend", label: "Legend", meta: `${visibleMapLayerRows.length} live`, visible: hasVisibleLegend },
  ].filter((section) => section.visible !== false);

  const currentSection = sections.find((section) => section.key === activeSection) ?? sections[0];

  function renderSectionDetail() {
    switch (currentSection?.key) {
      case "basemap":
        return (
          <div className={styles.layerDetailGroup}>
            <div className={styles.detailHeading}>
              <span className={styles.detailEyebrow}>Display mode</span>
              <strong className={styles.detailTitle}>Basemap</strong>
            </div>
            <div className={`${styles.layerDetailList} ${styles.layerDetailListStatic}`}>
              <div className={styles.basemapSwitchVertical}>
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
                <button
                  className={`${styles.basemapButton} ${basemapMode === "terrain3d" ? styles.basemapButtonActive : ""}`}
                  onClick={() => onSetBasemapMode("terrain3d")}
                  type="button"
                >
                  3D
                </button>
              </div>
            </div>
          </div>
        );
      case "presets":
        return (
          <div className={styles.layerDetailGroup}>
            <div className={styles.detailHeading}>
              <span className={styles.detailEyebrow}>Visibility presets</span>
              <strong className={styles.detailTitle}>Presets</strong>
            </div>
            <div className={`${styles.layerDetailList} ${styles.layerDetailListStatic}`}>
              <div className={styles.presetSwitchCompact}>
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
          </div>
        );
      case "geofences":
        return (
          <div className={styles.layerDetailGroup}>
            <div className={styles.detailHeading}>
              <span className={styles.detailEyebrow}>Zone control</span>
              <strong className={styles.detailTitle}>Geofences</strong>
            </div>
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
              <p className={styles.layerHint}>
                {drawMode
                  ? "Click on the map to add vertices. Finish after at least 3 points."
                  : "Create or update operator boundaries directly on the map."}
              </p>
            </div>
          </div>
        );
      case "natural-hazards":
        return (
          <div className={styles.layerDetailGroup}>
            <div className={styles.detailHeaderRow}>
              <div className={styles.detailHeading}>
                <span className={styles.detailEyebrow}>Natural hazards</span>
                <strong className={styles.detailTitle}>Hazard Layers</strong>
              </div>
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
            </div>
            <div className={styles.layerDetailList}>
              <div className={styles.layerList}>
                {naturalHazardRows.map((row) => (
                  <label key={row.id} className={styles.layerRow}>
                    <span className={styles.layerText}>
                      <strong>
                        <span
                          aria-hidden="true"
                          className={styles.layerSwatch}
                          style={{ "--layer-color": row.color } as CSSProperties}
                        />
                        <span aria-hidden="true" className={styles.layerGlyph} style={{ "--layer-color": row.color } as CSSProperties}>
                          {row.icon}
                        </span>
                        <span>{compactOperationalTitle(row.title, row.id)}</span>
                      </strong>
                      {compactHazardMeta(row.periodLabel) ? <span>{compactHazardMeta(row.periodLabel)}</span> : null}
                    </span>
                    <span className={styles.layerRowActions}>
                      <span className={styles.layerRowMetric} style={{ "--layer-color": row.color } as CSSProperties}>
                        {compactLayerMetric(row.countLabel)}
                      </span>
                      <TacticalSwitch
                        checked={row.checked}
                        disabled={row.disabled}
                        label={`${row.checked ? "Hide" : "Show"} ${row.title}`}
                        onChange={() => onToggleMapLayer(row.id)}
                      />
                    </span>
                  </label>
                ))}
                <label className={styles.layerRow}>
                  <span className={styles.layerText}>
                    <strong>
                      <span
                        aria-hidden="true"
                        className={styles.layerSwatch}
                        style={{ "--layer-color": "#448aff" } as CSSProperties}
                      />
                      <span aria-hidden="true" className={styles.layerGlyph} style={{ "--layer-color": "#448aff" } as CSSProperties}>
                        D
                      </span>
                      <span>DAY/NIGHT</span>
                    </strong>
                    <span>5 MIN</span>
                  </span>
                  <span className={styles.layerRowActions}>
                    <span className={styles.layerRowMetric} style={{ "--layer-color": "#448aff" } as CSSProperties}>1</span>
                    <TacticalSwitch
                      checked={layerState.dayNight}
                      label={layerState.dayNight ? "Hide day and night overlay" : "Show day and night overlay"}
                      onChange={() => onToggleLayer("dayNight")}
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>
        );
      case "operational-feeds":
        return (
          <div className={styles.layerDetailGroup}>
            <div className={styles.detailHeaderRow}>
              <div className={styles.detailHeading}>
                <span className={styles.detailEyebrow}>Operational feeds</span>
                <strong className={styles.detailTitle}>Intel Layers</strong>
              </div>
              <TacticalSwitch
                checked={allOperationalRowsChecked}
                label={allOperationalRowsChecked ? "Disable all operational feeds" : "Enable all operational feeds"}
                onChange={() => setMapLayerGroup(operationalRows, !allOperationalRowsChecked)}
              />
            </div>
            <div className={styles.layerDetailList}>
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
                        <span>{compactOperationalTitle(row.title, row.id)}</span>
                      </strong>
                      {compactOperationalMeta(row.meta, row.title) ? <span>{compactOperationalMeta(row.meta, row.title)}</span> : null}
                    </span>
                    <span className={styles.layerRowActions}>
                      <span className={styles.layerRowMetric} style={{ "--layer-color": row.color } as CSSProperties}>
                        {compactLayerMetric(row.countLabel)}
                      </span>
                      <TacticalSwitch
                        checked={row.checked}
                        disabled={row.disabled}
                        label={`${row.checked ? "Hide" : "Show"} ${row.title}`}
                        onChange={() => onToggleMapLayer(row.id)}
                      />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case "tracking":
        return (
          <div className={styles.layerDetailGroup}>
            <div className={styles.detailHeaderRow}>
              <div className={styles.detailHeading}>
                <span className={styles.detailEyebrow}>Air and routes</span>
                <strong className={styles.detailTitle}>Tracking</strong>
              </div>
              <TacticalSwitch
                checked={allTrafficRowsChecked}
                label={allTrafficRowsChecked ? "Disable all tracking layers" : "Enable all tracking layers"}
                onChange={() => setLocalLayerGroup(trafficLayerRows, !allTrafficRowsChecked)}
              />
            </div>
            <div className={styles.layerDetailList}>
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
            </div>
          </div>
        );
      case "context":
        return (
          <div className={styles.layerDetailGroup}>
            <div className={styles.detailHeaderRow}>
              <div className={styles.detailHeading}>
                <span className={styles.detailEyebrow}>Threat context</span>
                <strong className={styles.detailTitle}>Context Layers</strong>
              </div>
              <TacticalSwitch
                checked={allContextRowsChecked}
                label={allContextRowsChecked ? "Disable all context layers" : "Enable all context layers"}
                onChange={() => setLocalLayerGroup(contextLayerRows, !allContextRowsChecked)}
              />
            </div>
            <div className={styles.layerDetailList}>
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
            </div>
          </div>
        );
      case "visible-legend":
        return (
          <div className={styles.layerDetailGroup}>
            <div className={styles.detailHeading}>
              <span className={styles.detailEyebrow}>Visible now</span>
              <strong className={styles.detailTitle}>Legend</strong>
            </div>
            <div className={styles.layerDetailList}>
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
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <section className={styles.layerSelector} id="layer-panel">
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelLabel}>Data Layers</span>
        </div>
        <button className={styles.closeButton} onClick={onClose} type="button">
          Close
        </button>
      </div>
      <div className={styles.layerRailShell}>
        <nav aria-label="Layer sections" className={styles.layerRail}>
          {sections.map((section) => (
            <button
              key={section.key}
              className={`${styles.layerRailItem} ${activeSection === section.key ? styles.layerRailItemActive : ""} ${section.tone === "accent" ? styles.layerRailItemAccent : ""} ${section.tone === "info" ? styles.layerRailItemInfo : ""}`}
              onClick={() => setActiveSection(section.key)}
              type="button"
            >
              <span className={styles.layerRailMarker} />
              <span className={styles.layerRailLabel}>{section.label}</span>
              <span className={styles.layerRailMeta}>{section.meta}</span>
            </button>
          ))}
        </nav>
        <div className={styles.layerDetailPanel}>
          {renderSectionDetail()}
        </div>
      </div>
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
