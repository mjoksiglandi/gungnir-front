"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import {
  createInitialMapView,
} from "./map-stage/map-stage-client-helpers";
import { useGeospatialOverlays } from "./map-stage/use-geospatial-overlays";
import { useMapStageClientViewModel } from "./map-stage/use-map-stage-client-view-model";
import { useMapStageCommandQueue } from "./map-stage/use-map-stage-command-queue";
import { useOperationsRuntime } from "./map-stage/operations-runtime-provider";
import { MapStageAssetSidebar } from "./map-stage/map-stage-asset-sidebar";
import { MapStageCanvas } from "./map-stage/map-stage-canvas";
import { MapStageControlDock } from "./map-stage/map-stage-control-dock";
import { MapStageDeviceSidebar } from "./map-stage/map-stage-device-sidebar";
import { useLiveOperationsBootstrap } from "./map-stage/use-live-operations-bootstrap";
import { useMapStageSelection } from "./map-stage/use-map-stage-selection";
import { useMapStageUi } from "./map-stage/use-map-stage-ui";
import styles from "./map-stage.module.css";

export function MapStageClient({
  bootstrap,
}: Readonly<{
  bootstrap: MapStageBootstrap;
}>) {
  const searchParams = useSearchParams();
  const { earthquakes, fireHotspots } = useGeospatialOverlays(bootstrap.geospatial.fireHotspots ?? null);
  const {
    acknowledgeAlert,
    ensureMapLayerFeatureCollection,
    geofences,
    isMapLayerLoading,
    mapLayers,
    resolveAlert,
    selectedAssetCommands,
    selectedAssetDevice,
    selectedAssetMissions,
    selectedAssetTelemetry,
    sendCommand,
    sessionUser,
  } = useOperationsRuntime();
  const { assetTracks, liveBootstrap } = useLiveOperationsBootstrap(bootstrap);
  const { alerts, assets, incidents, layers } = liveBootstrap.snapshot;
  const { openAsset, replaceOperationsSelection, selectedAsset, selectedAssetId } = useMapStageSelection({
    alerts,
    assets,
    incidents,
  });
  const geofenceLayers = useMemo(
    () => layers.filter((layer) => layer.polygon.length > 0),
    [layers],
  );
  const initialMapView = useMemo(() => createInitialMapView(searchParams), [searchParams]);
  const {
    actionState,
    addDrawPoint,
    applyVisibilityPreset,
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
    mapLayerRows,
    searchQuery,
    selectedAssetTrack,
    setActionState,
    setBasemapMode,
    setDeviceFilter,
    setSearchQuery,
    setShowDeviceSidebar,
    showDeviceSidebar,
    showLayerPanel,
    startDrawing,
    toggleMapLayer,
    toggleDeviceSidebar,
    toggleFollowAsset,
    toggleLayer,
    toggleLayerPanel,
    visibleAssets,
    visibleMapLayers,
  } = useMapStageUi({
    alerts,
    assetTracks,
    assets,
    clearSelection: () => replaceOperationsSelection(),
    initialLayersParam: searchParams.get("layers"),
    layers: geofenceLayers,
    mapLayers,
    onMapLayerShown: ensureMapLayerFeatureCollection,
    selectedAsset,
  });
  const {
    assetCounts,
    controlDockMapLayerRows,
    layerRows,
    relatedAlerts,
    relatedIncidents,
    relatedMissions,
    selectedCommands,
    selectedDevice,
    selectedTelemetry,
    visibleEarthquakes,
    visibleFireHotspots,
  } = useMapStageClientViewModel({
    alerts,
    assets,
    drawnGeofenceCount: drawnGeofences.length,
    earthquakes,
    fireHotspots,
    geofenceLayerCount: geofenceLayers.length,
    incidents,
    incidentSignalCount: incidentSignals.length,
    isMapLayerLoading,
    mapLayerRows,
    selectedAsset,
    selectedAssetCommands,
    selectedAssetDevice,
    selectedAssetMissions,
    selectedAssetTelemetry,
    selectedAssetTrackCount: selectedAssetTrack.length,
    showRoutes: Boolean(selectedAsset),
    visibleMapLayers,
  });
  const queueSelectedAssetCommand = useMapStageCommandQueue({
    selectedAsset,
    selectedDevice,
    sendCommand,
    setActionState,
  });

  return (
    <section className={styles.stage} aria-label="Operational map stage">
      <MapStageCanvas
        basemapMode={basemapMode}
        drawMode={drawMode}
        drawPoints={drawPoints}
        drawnGeofences={drawnGeofences}
        focusRequest={focusRequest}
        followTarget={followTarget}
        geofences={geofences}
        initialView={initialMapView}
        earthquakes={visibleEarthquakes}
        fireHotspots={visibleFireHotspots}
        incidentSignals={incidentSignals}
        layerState={layerState}
        layers={geofenceLayers}
        mapLayers={visibleMapLayers}
        onAddDrawPoint={addDrawPoint}
        onOpenAsset={openAsset}
        selectedAssetTrack={selectedAssetTrack}
        visibleAssets={visibleAssets}
      />

      <MapStageControlDock
        basemapMode={basemapMode}
        drawMode={drawMode}
        drawPointsCount={drawPoints.length}
        isDeviceSidebarOpen={showDeviceSidebar}
        layerRows={layerRows}
        layerState={layerState}
        mapLayerRows={controlDockMapLayerRows}
        selectedAsset={selectedAsset}
        showLayerPanel={showLayerPanel}
        onCancelDrawing={cancelDrawing}
        onClearFocus={clearFocus}
        onFinishGeofence={finishGeofence}
        onSetBasemapMode={setBasemapMode}
        onStartDrawing={startDrawing}
        onApplyVisibilityPreset={applyVisibilityPreset}
        onToggleMapLayer={toggleMapLayer}
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
          commands={selectedCommands}
          followAssetId={followAssetId}
          layerState={layerState}
          relatedAlerts={relatedAlerts}
          relatedIncidents={relatedIncidents}
          relatedMissions={relatedMissions}
          selectedDevice={selectedDevice}
          selectedAsset={selectedAsset}
          telemetry={selectedTelemetry}
          userLabel={sessionUser?.displayName ?? "Operator"}
          onAcknowledgeAlert={acknowledgeAlert}
          onCenterOnAsset={centerOnAsset}
          onClearFocus={clearFocus}
          onQueueCommand={async (_asset, commandLabel, tone) => {
            await queueSelectedAssetCommand?.(commandLabel, tone);
          }}
          onResolveAlert={resolveAlert}
          onToggleFollowAsset={toggleFollowAsset}
          onToggleLayer={toggleLayer}
        />
      ) : null}
    </section>
  );
}
