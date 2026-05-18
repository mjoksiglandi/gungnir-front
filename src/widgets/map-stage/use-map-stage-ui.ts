"use client";

import { useMemo, useState } from "react";
import type { LatLngTuple } from "leaflet";
import type { Alert, Asset, GeoLayer } from "@/shared/contracts/operational";
import { buildIncidentSignals, createInitialLayerState } from "./helpers";
import type {
  ActionState,
  AssetTrackPoint,
  BasemapMode,
  DeviceFilter,
  DrawnGeofence,
  FocusRequest,
  LayerState,
} from "./types";

export function useMapStageUi({
  alerts,
  assetTracks,
  assets,
  clearSelection,
  layers,
  selectedAsset,
}: Readonly<{
  alerts: Alert[];
  assetTracks: Record<string, AssetTrackPoint[]>;
  assets: Asset[];
  clearSelection: () => void;
  layers: GeoLayer[];
  selectedAsset: Asset | null;
}>) {
  const [showDeviceSidebar, setShowDeviceSidebar] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [basemapMode, setBasemapMode] = useState<BasemapMode>("map");
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Array<{ lat: number; lon: number }>>([]);
  const [drawnGeofences, setDrawnGeofences] = useState<DrawnGeofence[]>([]);
  const [layerState, setLayerState] = useState<LayerState>(() => createInitialLayerState(layers));
  const [followAssetId, setFollowAssetId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [actionState, setActionState] = useState<ActionState | null>(null);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesFilter = deviceFilter === "all" || asset.assetType === deviceFilter;
      const searchValue = `${asset.callsign} ${asset.name} ${asset.assetType}`.toLowerCase();
      const matchesSearch = searchValue.includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [assets, deviceFilter, searchQuery]);

  const visibleAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (asset.assetType === "air") return layerState.airTraffic;
        return layerState.groundTraffic;
      }),
    [assets, layerState.airTraffic, layerState.groundTraffic],
  );

  const incidentSignals = useMemo(() => buildIncidentSignals(assets, alerts), [alerts, assets]);
  const followedAsset = useMemo(
    () => (followAssetId ? assets.find((asset) => asset.id === followAssetId) ?? null : null),
    [assets, followAssetId],
  );
  const followTarget: LatLngTuple | null = followedAsset
    ? [followedAsset.position.lat, followedAsset.position.lon]
    : null;
  const selectedAssetTrack = useMemo(
    () =>
      selectedAsset
        ? (assetTracks[selectedAsset.id] ?? []).map<LatLngTuple>((point) => [point.lat, point.lon])
        : [],
    [assetTracks, selectedAsset],
  );

  function clearFocus() {
    clearSelection();
    setFollowAssetId(null);
  }

  function centerOnAsset(asset: Asset) {
    setFocusRequest({
      id: Date.now(),
      position: [asset.position.lat, asset.position.lon],
    });
    setActionState({
      tone: "default",
      message: `Centered on ${asset.callsign}.`,
    });
  }

  function toggleFollowAsset(asset: Asset) {
    setFollowAssetId((current) => {
      const nextFollowId = current === asset.id ? null : asset.id;

      setActionState({
        tone: "default",
        message: nextFollowId
          ? `Following ${asset.callsign} on the map.`
          : `Follow released for ${asset.callsign}.`,
      });

      if (nextFollowId) {
        setFocusRequest({
          id: Date.now(),
          position: [asset.position.lat, asset.position.lon],
        });
      }

      return nextFollowId;
    });
  }

  function queueCommand(asset: Asset, commandLabel: string, tone: ActionState["tone"] = "default") {
    setActionState({
      tone,
      message: `${commandLabel} queued for ${asset.callsign}.`,
    });
  }

  function toggleLayer(key: keyof LayerState) {
    setLayerState((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleDeviceSidebar() {
    setShowDeviceSidebar((current) => {
      const nextValue = !current;

      if (nextValue) {
        setShowLayerPanel(false);
      }

      return nextValue;
    });
  }

  function toggleLayerPanel() {
    setShowLayerPanel((current) => {
      const nextValue = !current;

      if (nextValue) {
        setShowDeviceSidebar(false);
      }

      return nextValue;
    });
  }

  function startDrawing() {
    setDrawMode(true);
    setDrawPoints([]);
  }

  function addDrawPoint(point: { lat: number; lon: number }) {
    setDrawPoints((current) => [...current, point]);
  }

  function cancelDrawing() {
    setDrawMode(false);
    setDrawPoints([]);
  }

  function finishGeofence() {
    if (drawPoints.length < 3) return;

    const nextId = `drawn-geofence-${drawnGeofences.length + 1}`;

    setDrawnGeofences((current) => [
      ...current,
      {
        id: nextId,
        name: `Geofence ${current.length + 1}`,
        polygon: drawPoints,
      },
    ]);
    setDrawMode(false);
    setDrawPoints([]);
  }

  return {
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
    setActionState,
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
  };
}
