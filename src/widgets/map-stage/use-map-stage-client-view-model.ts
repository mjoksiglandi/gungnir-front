"use client";

import { useMemo } from "react";
import type { Alert, Asset, Incident } from "@/shared/contracts/operational";
import type { EarthquakeLayer, FireHotspotLayer } from "@/shared/geospatial/contracts";
import {
  buildAssetCounts,
  buildLayerRows,
  decorateMapLayerRows,
  getRelatedAlerts,
  getRelatedIncidents,
  getVisibleHazardData,
} from "./map-stage-client-helpers";
import type { MapLayerRow } from "./types";
import type { Command, Device, MissionDeviceAssignment, TelemetryRecord, MapLayer } from "@/types/domain";

export function useMapStageClientViewModel({
  alerts,
  assets,
  drawnGeofenceCount,
  earthquakes,
  fireHotspots,
  geofenceLayerCount,
  incidents,
  incidentSignalCount,
  isMapLayerLoading,
  mapLayerRows,
  selectedAsset,
  selectedAssetCommands,
  selectedAssetDevice,
  selectedAssetMissionAssignments,
  selectedAssetTelemetry,
  selectedAssetTrackCount,
  showRoutes,
  visibleMapLayers,
}: Readonly<{
  alerts: Alert[];
  assets: Asset[];
  drawnGeofenceCount: number;
  earthquakes: EarthquakeLayer | null;
  fireHotspots: FireHotspotLayer | null;
  geofenceLayerCount: number;
  incidents: Incident[];
  incidentSignalCount: number;
  isMapLayerLoading: (layerId: string) => boolean;
  mapLayerRows: MapLayerRow[];
  selectedAsset: Asset | null;
  selectedAssetCommands: (assetId: string) => Command[];
  selectedAssetDevice: (assetId: string) => Device | null;
  selectedAssetMissionAssignments: (assetId: string, deviceId?: string | null) => MissionDeviceAssignment[];
  selectedAssetTelemetry: (assetId: string) => TelemetryRecord[];
  selectedAssetTrackCount: number;
  showRoutes: boolean;
  visibleMapLayers: MapLayer[];
}>) {
  const selectedAssetData = useMemo(() => {
    if (!selectedAsset) {
      return {
        relatedAlerts: [] as Alert[],
        relatedIncidents: [] as Incident[],
        relatedMissionAssignments: [] as MissionDeviceAssignment[],
        selectedCommands: [] as Command[],
        selectedDevice: null as Device | null,
        selectedTelemetry: [] as TelemetryRecord[],
      };
    }

    return {
      selectedDevice: selectedAssetDevice(selectedAsset.id),
      relatedAlerts: getRelatedAlerts(alerts, selectedAsset.id),
      relatedIncidents: getRelatedIncidents(incidents, selectedAsset.id),
      relatedMissionAssignments: [] as MissionDeviceAssignment[],
      selectedCommands: selectedAssetCommands(selectedAsset.id),
      selectedTelemetry: selectedAssetTelemetry(selectedAsset.id),
    };
  }, [
    alerts,
    incidents,
    selectedAsset,
    selectedAssetCommands,
    selectedAssetDevice,
    selectedAssetTelemetry,
  ]);

  const selectedAssetDataWithMissions = useMemo(() => ({
    ...selectedAssetData,
    relatedMissionAssignments: selectedAsset
      ? selectedAssetMissionAssignments(selectedAsset.id, selectedAssetData.selectedDevice?.id)
      : [],
  }), [selectedAsset, selectedAssetData, selectedAssetMissionAssignments]);

  const assetCounts = useMemo(() => buildAssetCounts(assets), [assets]);
  const earthquakeCount = earthquakes?.events.length ?? 0;
  const wildfireCount = fireHotspots?.hotspots.length ?? 0;

  const layerRows = useMemo(() => buildLayerRows({
    assetCounts,
    drawnGeofenceCount,
    earthquakeCount,
    geofenceLayerCount,
    incidentSignalCount,
    selectedAssetTrackCount,
    showRoutes,
    wildfireCount,
  }), [
    assetCounts,
    drawnGeofenceCount,
    earthquakeCount,
    geofenceLayerCount,
    incidentSignalCount,
    selectedAssetTrackCount,
    showRoutes,
    wildfireCount,
  ]);

  const controlDockMapLayerRows = useMemo(
    () => decorateMapLayerRows(mapLayerRows, isMapLayerLoading),
    [isMapLayerLoading, mapLayerRows],
  );

  const { visibleEarthquakes, visibleFireHotspots } = useMemo(
    () => getVisibleHazardData(visibleMapLayers, earthquakes, fireHotspots),
    [earthquakes, fireHotspots, visibleMapLayers],
  );

  return {
    assetCounts,
    controlDockMapLayerRows,
    layerRows,
    visibleEarthquakes,
    visibleFireHotspots,
    ...selectedAssetDataWithMissions,
  };
}
