"use client";

import { useMemo } from "react";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import { MapStageAssetSidebar } from "./map-stage/map-stage-asset-sidebar";
import { MapStageCanvas } from "./map-stage/map-stage-canvas";
import { MapStageControlDock } from "./map-stage/map-stage-control-dock";
import { MapStageDeviceSidebar } from "./map-stage/map-stage-device-sidebar";
import { useLiveOperationsBootstrap } from "./map-stage/use-live-operations-bootstrap";
import { useMapStageSelection } from "./map-stage/use-map-stage-selection";
import { useMapStageUi } from "./map-stage/use-map-stage-ui";
import type { LayerRow } from "./map-stage/types";
import styles from "./map-stage.module.css";

export function MapStageClient({
  bootstrap,
}: Readonly<{
  bootstrap: MapStageBootstrap;
}>) {
  const { assetTracks, liveBootstrap } = useLiveOperationsBootstrap(bootstrap);
  const { alerts, assets, incidents, layers } = liveBootstrap.snapshot;
  const fireHotspotLayer = liveBootstrap.geospatial.fireHotspots;
  const { openAsset, replaceOperationsSelection, selectedAsset, selectedAssetId } = useMapStageSelection({
    alerts,
    assets,
    incidents,
  });
  const {
    actionState,
    addDrawPoint,
    basemapMode,
    cancelDrawing,
    centerOnAsset,
    clearFocus,
    deviceFilter,
    drawMode,
    drawPoints,
    drawnGeofences,
    filteredAssets,
    finishGeofence,
    focusRequest,
    followAssetId,
    followTarget,
    incidentSignals,
    layerState,
    queueCommand,
    searchQuery,
    selectedAssetTrack,
    setBasemapMode,
    setDeviceFilter,
    setSearchQuery,
    setShowDeviceSidebar,
    showDeviceSidebar,
    showLayerPanel,
    startDrawing,
    toggleDeviceSidebar,
    toggleFollowAsset,
    toggleLayer,
    toggleLayerPanel,
    visibleAssets,
  } = useMapStageUi({
    alerts,
    assetTracks,
    assets,
    clearSelection: () => replaceOperationsSelection(),
    layers,
    selectedAsset,
  });

  const assetCounts = useMemo(
    () => ({
      air: assets.filter((asset) => asset.assetType === "air").length,
      ground: assets.filter((asset) => asset.assetType === "ground").length,
      personnel: assets.filter((asset) => asset.assetType === "personnel").length,
    }),
    [assets],
  );
  const nonAirAssetCount = useMemo(
    () => assets.filter((asset) => asset.assetType !== "air").length,
    [assets],
  );
  const layerRows = useMemo<LayerRow[]>(
    () => [
      { key: "airTraffic", title: "Air traffic", meta: `${assetCounts.air} tracks` },
      { key: "groundTraffic", title: "Ground traffic", meta: `${nonAirAssetCount} units` },
      { key: "incidents", title: "Incidents & alerts", meta: `${incidentSignals.length} local signals` },
      {
        key: "routes",
        title: "Route mode",
        meta: selectedAsset ? `${selectedAssetTrack.length} track points` : "select a device",
      },
      { key: "geofences", title: "Geofences", meta: `${layers.length + drawnGeofences.length} zones` },
      { key: "heatZones", title: "Fire hotspots", meta: `${fireHotspotLayer.hotspots.length} BCN/NASA points` },
      { key: "labels", title: "Labels", meta: "map annotations" },
    ],
    [
      assetCounts.air,
      drawnGeofences.length,
      fireHotspotLayer.hotspots.length,
      incidentSignals.length,
      layers.length,
      nonAirAssetCount,
      selectedAsset,
      selectedAssetTrack.length,
    ],
  );
  const relatedIncidents = useMemo(
    () => (selectedAsset ? incidents.filter((incident) => incident.assetIds.includes(selectedAsset.id)) : []),
    [incidents, selectedAsset],
  );

  return (
    <section className={styles.stage} aria-label="Operational map stage">
      <MapStageCanvas
        basemapMode={basemapMode}
        drawMode={drawMode}
        drawPoints={drawPoints}
        drawnGeofences={drawnGeofences}
        fireHotspots={fireHotspotLayer.hotspots}
        focusRequest={focusRequest}
        followTarget={followTarget}
        incidentSignals={incidentSignals}
        layerState={layerState}
        layers={layers}
        onAddDrawPoint={addDrawPoint}
        onOpenAsset={openAsset}
        selectedAssetTrack={selectedAssetTrack}
        visibleAssets={visibleAssets}
      />

      <MapStageControlDock
        basemapMode={basemapMode}
        drawMode={drawMode}
        drawPointsCount={drawPoints.length}
        fireHotspotLayer={fireHotspotLayer}
        isDeviceSidebarOpen={showDeviceSidebar}
        layerRows={layerRows}
        layerState={layerState}
        selectedAsset={selectedAsset}
        showLayerPanel={showLayerPanel}
        onCancelDrawing={cancelDrawing}
        onClearFocus={clearFocus}
        onFinishGeofence={finishGeofence}
        onSetBasemapMode={setBasemapMode}
        onStartDrawing={startDrawing}
        onToggleDeviceSidebar={toggleDeviceSidebar}
        onToggleLayer={toggleLayer}
        onToggleLayerPanel={toggleLayerPanel}
      />

      {showDeviceSidebar ? (
        <MapStageDeviceSidebar
          assetCounts={assetCounts}
          assetsTotal={assets.length}
          deviceFilter={deviceFilter}
          filteredAssets={filteredAssets}
          searchQuery={searchQuery}
          selectedAssetId={selectedAssetId || null}
          onClose={() => setShowDeviceSidebar(false)}
          onDeviceFilterChange={setDeviceFilter}
          onOpenAsset={openAsset}
          onSearchQueryChange={setSearchQuery}
        />
      ) : null}

      {selectedAsset ? (
        <MapStageAssetSidebar
          actionState={actionState}
          followAssetId={followAssetId}
          layerState={layerState}
          relatedIncidents={relatedIncidents}
          selectedAsset={selectedAsset}
          onCenterOnAsset={centerOnAsset}
          onClearFocus={clearFocus}
          onQueueCommand={queueCommand}
          onToggleFollowAsset={toggleFollowAsset}
          onToggleLayer={toggleLayer}
        />
      ) : null}
    </section>
  );
}
