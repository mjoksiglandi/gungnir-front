"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { browserApiClient } from "@/lib/api";
import { createRealtimeClient, type RealtimeConnectionStatus, type RealtimeEventMap } from "@/lib/ws";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import type { Alert, Asset, Command, Device, Geofence, MapLayer, Mission, TelemetryRecord, Track } from "@/types/domain";
import {
  toOperationalAlert,
  toOperationalScenario,
  toTelemetryRecord,
  toTrack,
  toTrackHistoryPoint,
} from "@/types/domain";
import type {
  AuthUserDto,
  CommandCreateDto,
  GeoJsonFeatureCollection,
  MapLayerDto,
  TrackHistoryDto,
} from "@/types/api";
import { isAllowedMapLayer } from "./helpers";

type AssetTrackPoint = {
  lat: number;
  lon: number;
};

type OperationsRuntimeContextValue = {
  assetTracks: Record<string, AssetTrackPoint[]>;
  commands: Command[];
  connectionStatus: RealtimeConnectionStatus;
  devices: Device[];
  ensureMapLayerFeatureCollection: (layerId: string) => Promise<void>;
  geofences: Geofence[];
  isMapLayerLoading: (layerId: string) => boolean;
  liveBootstrap: MapStageBootstrap;
  mapLayers: MapLayer[];
  missions: Mission[];
  selectedAssetCommands: (assetId: string) => Command[];
  selectedAssetDevice: (assetId: string) => Device | null;
  selectedAssetMissions: (assetId: string) => Mission[];
  selectedAssetTelemetry: (assetId: string) => TelemetryRecord[];
  sendCommand: (input: CommandCreateDto) => Promise<Command>;
  acknowledgeAlert: (id: string) => Promise<Alert>;
  resolveAlert: (id: string) => Promise<Alert>;
  sessionUser: AuthUserDto | null;
};

const OperationsRuntimeContext = createContext<OperationsRuntimeContextValue | null>(null);

function mergeUniqueTrackPoints(existing: AssetTrackPoint[], incoming: AssetTrackPoint[]) {
  const merged = [...existing, ...incoming];
  const seen = new Set<string>();

  return merged.filter((point) => {
    const key = `${point.lat.toFixed(6)}:${point.lon.toFixed(6)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildTrackMap(history: TrackHistoryDto[], currentTracks: Track[]) {
  const nextMap: Record<string, AssetTrackPoint[]> = {};

  for (const point of history.map(toTrackHistoryPoint)) {
    nextMap[point.assetId] ??= [];
    nextMap[point.assetId].push({
      lat: point.position.lat,
      lon: point.position.lon,
    });
  }

  for (const track of currentTracks) {
    nextMap[track.assetId] = mergeUniqueTrackPoints(nextMap[track.assetId] ?? [], [{
      lat: track.position.lat,
      lon: track.position.lon,
    }]);
  }

  return nextMap;
}

function mergeAssets(assets: Asset[], tracks: Track[], telemetry: TelemetryRecord[]) {
  return assets.map((asset) => {
    const track = tracks.find((candidate) => candidate.assetId === asset.id);
    const latestTelemetry = telemetry.find((candidate) => candidate.assetId === asset.id);

    if (!track && !latestTelemetry) {
      return asset;
    }

    return {
      ...asset,
      position: track?.position ?? asset.position,
      batteryPct: latestTelemetry?.batteryPct ?? asset.batteryPct,
      linkQualityPct: latestTelemetry?.signalQuality ?? asset.linkQualityPct,
      updatedAt: track?.timestamp ?? latestTelemetry?.timestamp ?? asset.updatedAt,
    };
  });
}

const mapLayerSourceTypes = new Set<MapLayerDto["sourceType"]>([
  "internal",
  "external",
  "fire-intel",
  "air-traffic",
  "notams",
  "weather",
]);

type SnapshotLayer = MapStageBootstrap["snapshot"]["layers"][number] & {
  confidence?: number;
  featureCollectionUrl?: string;
  metadata?: MapLayerDto["metadata"];
  refreshIntervalSec?: number;
  source?: string;
  ttlSec?: number;
};

function sourceTypeFromSnapshotLayer(layer: SnapshotLayer): MapLayerDto["sourceType"] {
  if (mapLayerSourceTypes.has(layer.source as MapLayerDto["sourceType"])) {
    return layer.source as MapLayerDto["sourceType"];
  }

  if (layer.metadata?.dataset === "notams") {
    return "notams";
  }

  return "internal";
}

function mapLayerFromSnapshotLayer(layer: SnapshotLayer): MapLayer | null {
  const isBackendMapLayer = Boolean(layer.featureCollectionUrl || layer.metadata?.provider || layer.metadata?.dataset);

  if (!isBackendMapLayer) {
    return null;
  }

  return {
    id: layer.id,
    name: layer.name,
    layerType: layer.layerType,
    sourceType: sourceTypeFromSnapshotLayer(layer),
    enabled: layer.visibleByDefault,
    refreshIntervalSec: layer.refreshIntervalSec ?? 0,
    ttlSec: layer.ttlSec ?? 0,
    lastUpdatedAt: layer.updatedAt,
    confidence: layer.confidence ?? 100,
    featureCollectionUrl: layer.featureCollectionUrl,
    metadata: layer.metadata ?? {},
    createdAt: layer.updatedAt,
    updatedAt: layer.updatedAt,
  };
}

function mapLayersFromBootstrap(bootstrap: MapStageBootstrap) {
  return mapLayersFromSnapshotLayers(bootstrap.snapshot.layers as SnapshotLayer[]);
}

function mapLayersFromSnapshotLayers(layers: SnapshotLayer[]) {
  return layers
    .map((layer) => mapLayerFromSnapshotLayer(layer as SnapshotLayer))
    .filter((layer): layer is MapLayer => Boolean(layer))
    .filter(isAllowedMapLayer);
}

async function loadCompatibilityMapLayers() {
  const response = await fetch("/api/v1/layers", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Could not load compatibility map layers (${response.status}).`);
  }

  return mapLayersFromSnapshotLayers(await response.json() as SnapshotLayer[]);
}

async function loadMapLayers(): Promise<MapLayer[]> {
  try {
    return (await browserApiClient.get<MapLayerDto[]>("/map-layers")).filter(isAllowedMapLayer);
  } catch {
    return loadCompatibilityMapLayers();
  }
}

async function loadMapLayerFeatureCollection(layer: MapLayer) {
  if (layer.featureCollectionUrl?.startsWith("/api/")) {
    const response = await fetch(layer.featureCollectionUrl, {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`Could not load map layer '${layer.id}' (${response.status}).`);
    }

    return await response.json() as GeoJsonFeatureCollection;
  }

  return browserApiClient.get<GeoJsonFeatureCollection>(`/map-layers/${layer.id}/geojson`);
}

function mergeMapLayers(currentLayers: MapLayer[], nextLayers: MapLayer[]) {
  return nextLayers.map((layer) => ({
    ...layer,
    featureCollection: currentLayers.find((candidate) => candidate.id === layer.id)?.featureCollection,
  }));
}

export function OperationsRuntimeProvider({
  children,
  initialBootstrap,
}: Readonly<{
  children: ReactNode;
  initialBootstrap: MapStageBootstrap;
}>) {
  const [sessionUser, setSessionUser] = useState<AuthUserDto | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>("connecting");
  const [devices, setDevices] = useState<Device[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>(initialBootstrap.snapshot.alerts);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [mapLayers, setMapLayers] = useState<MapLayer[]>(() => mapLayersFromBootstrap(initialBootstrap));
  const [mapLayerLoadingIds, setMapLayerLoadingIds] = useState<string[]>([]);
  const [assetTracks, setAssetTracks] = useState<Record<string, AssetTrackPoint[]>>(() =>
    Object.fromEntries(initialBootstrap.snapshot.assets.map((asset) => [asset.id, [{
      lat: asset.position.lat,
      lon: asset.position.lon,
    }]])),
  );
  const [snapshot, setSnapshot] = useState(initialBootstrap.snapshot);

  const ensureMapLayerFeatureCollection = useCallback(async (layerId: string) => {
    const layer = mapLayers.find((candidate) => candidate.id === layerId);
    if (!layer || layer.featureCollection || mapLayerLoadingIds.includes(layerId)) {
      return;
    }

    setMapLayerLoadingIds((current) => current.includes(layerId) ? current : [...current, layerId]);

    try {
      const featureCollection = await loadMapLayerFeatureCollection(layer);
      setMapLayers((current) => current.map((candidate) => candidate.id === layerId
        ? {
            ...candidate,
            featureCollection,
          }
        : candidate));
    } finally {
      setMapLayerLoadingIds((current) => current.filter((id) => id !== layerId));
    }
  }, [mapLayerLoadingIds, mapLayers]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapRuntime() {
      const [
        sessionResponse,
        nextSnapshot,
        nextDevices,
        nextCurrentTracks,
        nextTrackHistory,
        nextTelemetry,
        nextCommands,
        nextMissions,
        nextGeofences,
        nextMapLayers,
      ] = await Promise.all([
        fetch("/api/session/me", { cache: "no-store", credentials: "same-origin" }),
        browserApiClient.get("/v1/operations/snapshot"),
        browserApiClient.get("/devices"),
        browserApiClient.get("/tracks/current"),
        browserApiClient.get("/tracks/history"),
        browserApiClient.get("/telemetry"),
        browserApiClient.get("/commands"),
        browserApiClient.get("/missions"),
        browserApiClient.get("/geofences"),
        loadMapLayers(),
      ]);

      if (cancelled) {
        return;
      }

      if (sessionResponse.ok) {
        const sessionPayload = await sessionResponse.json() as { user: AuthUserDto };
        setSessionUser(sessionPayload.user);
      }

      const mappedSnapshot = toOperationalScenario(nextSnapshot as never);
      const mappedTracks = (nextCurrentTracks as never[]).map(toTrack);
      const mappedTelemetry = (nextTelemetry as never[]).map(toTelemetryRecord);

      setSnapshot(mappedSnapshot);
      setAlerts(mappedSnapshot.alerts);
      setDevices(nextDevices as Device[]);
      setTracks(mappedTracks);
      setTelemetry(mappedTelemetry);
      setCommands(nextCommands as Command[]);
      setMissions(nextMissions as Mission[]);
      setGeofences(nextGeofences as Geofence[]);
      setMapLayers((current) => mergeMapLayers(current, nextMapLayers));
      setAssetTracks(buildTrackMap(nextTrackHistory as TrackHistoryDto[], mappedTracks));
    }

    void bootstrapRuntime();

    const realtimeClient = createRealtimeClient({
      onStatusChange: setConnectionStatus,
      onEvent(event, payload) {
        if (cancelled) {
          return;
        }

        void handleRealtimeEvent(event, payload);
      },
    });

    async function handleRealtimeEvent<K extends keyof RealtimeEventMap>(
      event: K,
      payload: RealtimeEventMap[K],
    ) {
      switch (event) {
        case "track.updated": {
          const nextPayload = payload as RealtimeEventMap["track.updated"];
          setTracks((current) => {
            const nextTrack: Track = {
              id: `track-${nextPayload.deviceId}`,
              assetId: nextPayload.assetId,
              deviceId: nextPayload.deviceId,
              timestamp: nextPayload.timestamp,
              position: {
                lat: nextPayload.lat,
                lon: nextPayload.lon,
              },
              status: "active",
              metadata: {},
              updatedAt: nextPayload.timestamp,
            };
            const filtered = current.filter((item) => item.deviceId !== nextPayload.deviceId);
            return [nextTrack, ...filtered];
          });

          setAssetTracks((current) => ({
            ...current,
            [nextPayload.assetId]: mergeUniqueTrackPoints(current[nextPayload.assetId] ?? [], [{
              lat: nextPayload.lat,
              lon: nextPayload.lon,
            }]),
          }));

          setSnapshot((current) => ({
            ...current,
            assets: current.assets.map((asset) => asset.id === nextPayload.assetId
              ? {
                  ...asset,
                  position: {
                    ...asset.position,
                    lat: nextPayload.lat,
                    lon: nextPayload.lon,
                  },
                  updatedAt: nextPayload.timestamp,
                }
              : asset),
          }));
          break;
        }
        case "telemetry.received": {
          const nextPayload = payload as RealtimeEventMap["telemetry.received"];
          const nextTelemetry = await browserApiClient.get(`/telemetry/${nextPayload.deviceId}`) as never[];
          const mappedTelemetry = nextTelemetry.map(toTelemetryRecord);
          setTelemetry((current) => {
            const filtered = current.filter((item) => item.deviceId !== nextPayload.deviceId);
            return [...mappedTelemetry, ...filtered].slice(0, 500);
          });
          break;
        }
        case "device.status.changed": {
          const nextPayload = payload as RealtimeEventMap["device.status.changed"];
          if (!nextPayload.deviceId) {
            return;
          }

          const nextDevice = await browserApiClient.get(`/devices/${nextPayload.deviceId}`) as Device;
          setDevices((current) => [nextDevice, ...current.filter((item) => item.id !== nextDevice.id)]);
          break;
        }
        case "command.status.changed": {
          const nextCommands = await browserApiClient.get("/commands") as Command[];
          setCommands(nextCommands);
          break;
        }
        case "alert.created":
        case "alert.updated": {
          const nextAlerts = await browserApiClient.get("/alerts") as never[];
          const mappedAlerts = nextAlerts.map(toOperationalAlert);
          setAlerts(mappedAlerts);
          setSnapshot((current) => ({
            ...current,
            alerts: mappedAlerts,
          }));
          break;
        }
        case "mission.updated": {
          const nextMissions = await browserApiClient.get("/missions") as Mission[];
          setMissions(nextMissions);
          break;
        }
        case "layer.updated": {
          const nextMapLayers = await loadMapLayers();
          setMapLayers((current) => mergeMapLayers(current, nextMapLayers));
          break;
        }
        default:
          break;
      }
    }

    realtimeClient.connect();

    return () => {
      cancelled = true;
      realtimeClient.disconnect();
    };
  }, []);

  const liveSnapshot = useMemo(() => ({
    ...snapshot,
    assets: mergeAssets(snapshot.assets, tracks, telemetry),
    alerts,
  }), [alerts, snapshot, telemetry, tracks]);

  const value = useMemo<OperationsRuntimeContextValue>(() => ({
    assetTracks,
    commands,
    connectionStatus,
    devices,
    geofences,
    liveBootstrap: {
      ...initialBootstrap,
      snapshot: liveSnapshot,
    },
    mapLayers,
    missions,
    ensureMapLayerFeatureCollection,
    isMapLayerLoading(layerId) {
      return mapLayerLoadingIds.includes(layerId);
    },
    selectedAssetCommands(assetId) {
      const deviceIds = devices.filter((device) => device.assetId === assetId).map((device) => device.id);
      return commands.filter((command) => command.assetId === assetId || (command.deviceId ? deviceIds.includes(command.deviceId) : false));
    },
    selectedAssetDevice(assetId) {
      return devices.find((device) => device.assetId === assetId) ?? null;
    },
    selectedAssetMissions(assetId) {
      return missions.filter((mission) => mission.assignedUnits.includes(assetId));
    },
    selectedAssetTelemetry(assetId) {
      return telemetry.filter((item) => item.assetId === assetId);
    },
    async sendCommand(input) {
      const command = await browserApiClient.post<Command>("/commands", input);
      setCommands((current) => [command, ...current.filter((item) => item.id !== command.id)]);
      return command;
    },
    async acknowledgeAlert(id) {
      const updated = toOperationalAlert(await browserApiClient.post(`/alerts/${id}/ack`));
      setAlerts((current) => current.map((item) => item.id === id ? updated : item));
      return updated;
    },
    async resolveAlert(id) {
      const updated = toOperationalAlert(await browserApiClient.post(`/alerts/${id}/resolve`));
      setAlerts((current) => current.map((item) => item.id === id ? updated : item));
      return updated;
    },
    sessionUser,
  }), [
    assetTracks,
    commands,
    connectionStatus,
    devices,
    ensureMapLayerFeatureCollection,
    geofences,
    initialBootstrap,
    mapLayers,
    mapLayerLoadingIds,
    missions,
    sessionUser,
    liveSnapshot,
    telemetry,
  ]);

  return (
    <OperationsRuntimeContext.Provider value={value}>
      {children}
    </OperationsRuntimeContext.Provider>
  );
}

export function useOperationsRuntime() {
  const context = useContext(OperationsRuntimeContext);

  if (!context) {
    throw new Error("useOperationsRuntime must be used within OperationsRuntimeProvider.");
  }

  return context;
}
