"use client";

import { useEffect, useMemo, useState } from "react";
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
  BasemapMode,
  DeviceFilter,
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

export function useMapStageVisibility({
  alerts,
  assets,
  initialLayersParam,
  layers,
  mapLayers,
  onMapLayerShown,
  selectedAsset,
}: Readonly<{
  alerts: Alert[];
  assets: Asset[];
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
  const [layerState, setLayerState] = useState<LayerState>(() => ({
    ...createInitialLayerState(layers),
    dayNight: initialLayerIds.has("dayNight"),
  }));
  const [mapLayerVisibilityOverrides, setMapLayerVisibilityOverrides] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(mapLayers.map((layer) => [layer.id, initialLayerIds.has(layer.id)]).filter(([, visible]) => visible)),
  );

  const filteredAssets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesFilter = deviceFilter === "all"
        || (deviceFilter === "maritime"
          ? asset.assetType === "autonomous" || asset.assetType === "sensor"
          : asset.assetType === deviceFilter);
      const searchValue = `${asset.callsign} ${asset.name} ${asset.assetType}`.toLowerCase();

      return matchesFilter && searchValue.includes(normalizedQuery);
    });
  }, [assets, deviceFilter, searchQuery]);

  const visibleAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (asset.assetType === "air") {
          return layerState.airTraffic;
        }

        return layerState.groundTraffic;
      }),
    [assets, layerState.airTraffic, layerState.groundTraffic],
  );

  const incidentSignals = useMemo(() => buildIncidentSignals(assets, alerts), [alerts, assets]);

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
          riskMapLayerIds.includes(layer.id) || referenceMapLayerIds.includes(layer.id),
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
        dayNight: current.dayNight,
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

  return {
    applyVisibilityPreset,
    basemapMode,
    deviceFilter,
    filteredAssets,
    incidentSignals,
    layerState,
    mapLayerRows,
    searchQuery,
    setBasemapMode,
    setDeviceFilter,
    setSearchQuery,
    setShowDeviceSidebar,
    showDeviceSidebar,
    showLayerPanel,
    toggleDeviceSidebar,
    toggleLayer,
    toggleLayerPanel,
    toggleMapLayer,
    visibleAssets,
    visibleMapLayers,
  };
}
