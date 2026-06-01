"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import { useOperationsRuntime } from "./map-stage/operations-runtime-provider";
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
  const searchParams = useSearchParams();
  const {
    acknowledgeAlert,
    connectionStatus,
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
  const initialMapView = useMemo(() => {
    const lat = Number(searchParams.get("lat"));
    const lon = Number(searchParams.get("lon"));
    const zoom = Number(searchParams.get("zoom"));

    return {
      center: [
        Number.isFinite(lat) ? lat : -33.454,
        Number.isFinite(lon) ? lon : -70.655,
      ] as [number, number],
      zoom: Number.isFinite(zoom) ? Math.max(2, Math.min(18, zoom)) : 11,
    };
  }, [searchParams]);
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
  const selectedDevice = selectedAsset ? selectedAssetDevice(selectedAsset.id) : null;
  const selectedCommands = selectedAsset ? selectedAssetCommands(selectedAsset.id) : [];
  const selectedTelemetry = selectedAsset ? selectedAssetTelemetry(selectedAsset.id) : [];
  const relatedMissions = selectedAsset ? selectedAssetMissions(selectedAsset.id) : [];

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
      { key: "airTraffic", title: "Air disp", meta: `${assetCounts.air} tracks` },
      { key: "groundTraffic", title: "Ground traffic", meta: `${nonAirAssetCount} units` },
      { key: "incidents", title: "Incidents & alerts", meta: `${incidentSignals.length} local signals` },
      {
        key: "routes",
        title: "Route mode",
        meta: selectedAsset ? `${selectedAssetTrack.length} track points` : "select a device",
      },
      { key: "geofences", title: "Geofences", meta: `${geofenceLayers.length + drawnGeofences.length} zones` },
      { key: "labels", title: "Labels", meta: "map annotations" },
    ],
    [
      assetCounts.air,
      drawnGeofences.length,
      geofenceLayers.length,
      incidentSignals.length,
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
        focusRequest={focusRequest}
        followTarget={followTarget}
        geofences={geofences}
        initialView={initialMapView}
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
        mapLayerRows={mapLayerRows.map((row) => ({
          ...row,
          disabled: isMapLayerLoading(row.id),
          meta: isMapLayerLoading(row.id) ? `${row.meta} - loading` : row.meta,
        }))}
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
          connectionStatus={connectionStatus}
          followAssetId={followAssetId}
          layerState={layerState}
          relatedAlerts={alerts.filter((alert) => alert.assetId === selectedAsset.id)}
          relatedIncidents={relatedIncidents}
          relatedMissions={relatedMissions}
          selectedDevice={selectedDevice}
          selectedAsset={selectedAsset}
          telemetry={selectedTelemetry}
          userLabel={sessionUser?.displayName ?? "Operator"}
          onAcknowledgeAlert={acknowledgeAlert}
          onCenterOnAsset={centerOnAsset}
          onClearFocus={clearFocus}
          onQueueCommand={async (asset, commandLabel, tone) => {
            if (!selectedDevice) {
              setActionState({
                tone: "warning",
                message: `No linked device available for ${asset.callsign}.`,
              });
              return;
            }

            try {
              const createdCommand = await sendCommand({
                assetId: asset.id,
                deviceId: selectedDevice.id,
                payload: {
                  label: commandLabel,
                },
                priority: tone === "warning" ? 8 : 5,
                type: commandLabel.toLowerCase().replace(/\s+/g, "."),
              });

              setActionState({
                tone: tone ?? "default",
                message: `${createdCommand.type} ${createdCommand.status} for ${asset.callsign}.`,
              });
            } catch {
              setActionState({
                tone: "warning",
                message: `Unable to send ${commandLabel} for ${asset.callsign}.`,
              });
            }
          }}
          onResolveAlert={resolveAlert}
          onToggleFollowAsset={toggleFollowAsset}
          onToggleLayer={toggleLayer}
        />
      ) : null}
    </section>
  );
}
