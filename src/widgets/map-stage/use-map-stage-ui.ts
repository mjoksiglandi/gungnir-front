"use client";

import { useEffect, useMemo, useState } from "react";
import type { LatLngTuple } from "leaflet";
import type { Alert, Asset, GeoLayer } from "@/shared/contracts/operational";
import type { MapLayer } from "@/types/domain";
import {
  buildIncidentSignals,
  createInitialLayerState,
  getQueryLayerIds,
  isNaturalHazardMapLayer,
  isReferenceMapLayer,
  isRiskMapLayer,
  mapLayerDatasetLabel,
  mapLayerDisplayColor,
  mapLayerDisplayIcon,
  mapLayerVisibleByDefault,
} from "./helpers";
import type {
  ActionState,
  AssetTrackPoint,
  BasemapMode,
  DeviceFilter,
  DrawnGeofence,
  FocusRequest,
  LayerState,
  MapLayerRow,
  VisibilityPreset,
} from "./types";

function formatLayerCount(value: number | undefined) {
  return typeof value === "number" ? new Intl.NumberFormat("es-CL").format(value) : "--";
}

function naturalHazardTitle(layer: MapLayer) {
  if (layer.id === "layer-fire-intel") return "Active Fires";
  if (layer.id === "layer-earthquakes") return "Earthquakes";
  if (layer.id === "layer-weather-hazards") return "Severe Weather";
  return layer.name;
}

function naturalHazardPeriod(layer: MapLayer) {
  if (layer.id === "layer-earthquakes") return "(24h)";
  return undefined;
}

export function useMapStageUi({
  alerts,
  assetTracks,
  assets,
  clearSelection,
  layers,
  mapLayers,
  onMapLayerShown,
  selectedAsset,
  initialLayersParam,
}: Readonly<{
  alerts: Alert[];
  assetTracks: Record<string, AssetTrackPoint[]>;
  assets: Asset[];
  clearSelection: () => void;
  initialLayersParam: string | null;
  layers: GeoLayer[];
  mapLayers: MapLayer[];
  onMapLayerShown: (layerId: string) => Promise<void>;
  selectedAsset: Asset | null;
}>) {
  const initialLayerIds = useMemo(() => getQueryLayerIds(initialLayersParam), [initialLayersParam]);
  const [showDeviceSidebar, setShowDeviceSidebar] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [basemapMode, setBasemapMode] = useState<BasemapMode>("map");
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Array<{ lat: number; lon: number }>>([]);
  const [drawnGeofences, setDrawnGeofences] = useState<DrawnGeofence[]>([]);
  const [layerState, setLayerState] = useState<LayerState>(() => ({
    ...createInitialLayerState(layers),
    dayNight: initialLayerIds.has("dayNight"),
  }));
  const [mapLayerVisibilityOverrides, setMapLayerVisibilityOverrides] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(mapLayers.map((layer) => [layer.id, initialLayerIds.has(layer.id)]).filter(([, visible]) => visible)),
  );
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

  const mapLayerVisibility = useMemo(
    () =>
      Object.fromEntries(
        mapLayers.map((layer) => [
          layer.id,
          mapLayerVisibilityOverrides[layer.id] ?? mapLayerVisibleByDefault(layer),
        ]),
      ),
    [mapLayerVisibilityOverrides, mapLayers],
  );

  const riskMapLayerIds = useMemo(
    () => mapLayers.filter((layer) => isRiskMapLayer(layer) || isNaturalHazardMapLayer(layer)).map((layer) => layer.id),
    [mapLayers],
  );

  const referenceMapLayerIds = useMemo(
    () => mapLayers.filter(isReferenceMapLayer).map((layer) => layer.id),
    [mapLayers],
  );

  useEffect(() => {
    const visibleLayerIds = mapLayers
      .filter((layer) => mapLayerVisibility[layer.id])
      .map((layer) => layer.id);

    void Promise.all(visibleLayerIds.map((layerId) => onMapLayerShown(layerId)));
  }, [mapLayerVisibility, mapLayers, onMapLayerShown]);

  useEffect(() => {
    const refreshHandle = window.setInterval(() => {
      const visibleLayerIds = mapLayers
        .filter((layer) => mapLayerVisibility[layer.id])
        .map((layer) => layer.id);

      void Promise.all(visibleLayerIds.map((layerId) => onMapLayerShown(layerId)));
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(refreshHandle);
    };
  }, [mapLayerVisibility, mapLayers, onMapLayerShown]);

  const mapLayerRows = useMemo<MapLayerRow[]>(
    () => mapLayers
      .map((layer) => {
        const featureCount = layer.featureCollection?.features.length;
        const featureMeta = typeof featureCount === "number"
          ? `${featureCount} ${featureCount === 1 ? "item" : "items"}`
          : "not loaded";

        return {
          id: layer.id,
          color: mapLayerDisplayColor(layer),
          countLabel: formatLayerCount(featureCount),
          icon: mapLayerDisplayIcon(layer),
          periodLabel: naturalHazardPeriod(layer),
          title: isNaturalHazardMapLayer(layer) ? naturalHazardTitle(layer) : layer.name,
          meta: `${mapLayerDatasetLabel(layer.metadata)} - ${featureMeta}`,
          checked: Boolean(mapLayerVisibility[layer.id]),
          group: isNaturalHazardMapLayer(layer) ? "naturalHazards" as const : "operational" as const,
        };
      })
      .sort((left, right) => {
        const leftRisk = riskMapLayerIds.includes(left.id) ? 0 : 1;
        const rightRisk = riskMapLayerIds.includes(right.id) ? 0 : 1;
        return leftRisk - rightRisk || left.title.localeCompare(right.title);
      }),
    [mapLayerVisibility, mapLayers, riskMapLayerIds],
  );

  const visibleMapLayers = useMemo(
    () => mapLayers.filter((layer) => mapLayerVisibility[layer.id]),
    [mapLayerVisibility, mapLayers],
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

  function toggleMapLayer(layerId: string) {
    const nextVisible = !mapLayerVisibility[layerId];
    setMapLayerVisibilityOverrides((current) => ({
      ...current,
      [layerId]: nextVisible,
    }));

    if (nextVisible) {
      void onMapLayerShown(layerId);
    }
  }

  function applyVisibilityPreset(preset: VisibilityPreset) {
    if (preset === "operations") {
      setLayerState((current) => ({
        ...current,
        airTraffic: true,
        earthquakes: true,
        groundTraffic: true,
        incidents: true,
        routes: Boolean(selectedAsset),
        geofences: false,
        heatZones: true,
        dayNight: false,
        wildfires: true,
        labels: false,
      }));
      setMapLayerVisibilityOverrides(Object.fromEntries(
        mapLayers.map((layer) => [layer.id, riskMapLayerIds.includes(layer.id)]),
      ));
      return;
    }

    if (preset === "aviation") {
      setLayerState((current) => ({
        ...current,
        airTraffic: true,
        earthquakes: false,
        groundTraffic: false,
        incidents: false,
        routes: false,
        geofences: false,
        heatZones: false,
        dayNight: false,
        wildfires: false,
        labels: false,
      }));
      setMapLayerVisibilityOverrides(Object.fromEntries(
        mapLayers.map((layer) => [
          layer.id,
          riskMapLayerIds.includes(layer.id)
            || referenceMapLayerIds.includes(layer.id),
        ]),
      ));
      return;
    }

    if (preset === "risk") {
      setLayerState((current) => ({
        ...current,
        airTraffic: false,
        earthquakes: true,
        groundTraffic: false,
        incidents: true,
        routes: false,
        geofences: false,
        heatZones: true,
        dayNight: layerState.dayNight,
        wildfires: true,
        labels: false,
      }));
      setMapLayerVisibilityOverrides(Object.fromEntries(
        mapLayers.map((layer) => [layer.id, riskMapLayerIds.includes(layer.id)]),
      ));
      return;
    }

    setLayerState((current) => ({
      ...current,
      airTraffic: true,
      earthquakes: false,
      groundTraffic: false,
      incidents: false,
      routes: false,
      geofences: false,
      heatZones: false,
      dayNight: false,
      wildfires: false,
      labels: false,
    }));
    setMapLayerVisibilityOverrides(Object.fromEntries(
      mapLayers.map((layer) => [layer.id, false]),
    ));
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
    toggleMapLayer,
    toggleDeviceSidebar,
    toggleFollowAsset,
    toggleLayer,
    toggleLayerPanel,
    visibleAssets,
    visibleMapLayers,
  };
}
