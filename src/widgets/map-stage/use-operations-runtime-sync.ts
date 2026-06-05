"use client";

import { useEffect, useState } from "react";
import { browserApiClient } from "@/lib/api";
import { createRealtimeClient, type RealtimeConnectionStatus, type RealtimeEventMap } from "@/lib/ws";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import type { Alert, Command, Device, Geofence, MapLayer, Mission, TelemetryRecord, Track } from "@/types/domain";
import {
  toOperationalAlert,
  toOperationalScenario,
  toTelemetryRecord,
  toTrack,
  toTrackHistoryPoint,
} from "@/types/domain";
import type { AuthUserDto, TrackHistoryDto } from "@/types/api";
import { loadMapLayers } from "./use-operations-map-layers";

type AssetTrackPoint = {
  lat: number;
  lon: number;
};

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

export function mergeAssetsWithRuntimeState(
  assets: MapStageBootstrap["snapshot"]["assets"],
  tracks: Track[],
  telemetry: TelemetryRecord[],
) {
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

export function useOperationsRuntimeSync(options: {
  initialBootstrap: MapStageBootstrap;
  replaceMapLayers: (nextLayers: MapLayer[]) => void;
}) {
  const { initialBootstrap, replaceMapLayers } = options;
  const [sessionUser, setSessionUser] = useState<AuthUserDto | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>("connecting");
  const [devices, setDevices] = useState<Device[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>(initialBootstrap.snapshot.alerts);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [assetTracks, setAssetTracks] = useState<Record<string, AssetTrackPoint[]>>(() =>
    Object.fromEntries(initialBootstrap.snapshot.assets.map((asset) => [asset.id, [{
      lat: asset.position.lat,
      lon: asset.position.lon,
    }]])),
  );
  const [snapshot, setSnapshot] = useState(initialBootstrap.snapshot);

  useEffect(() => {
    let cancelled = false;

    async function refreshAlerts() {
      const nextAlerts = await browserApiClient.get("/alerts") as never[];

      if (cancelled) {
        return;
      }

      const mappedAlerts = nextAlerts.map(toOperationalAlert);
      setAlerts(mappedAlerts);
      setSnapshot((current) => ({
        ...current,
        alerts: mappedAlerts,
      }));
    }

    async function refreshMissions() {
      const nextMissions = await browserApiClient.get("/missions") as Mission[];

      if (!cancelled) {
        setMissions(nextMissions);
      }
    }

    async function refreshCommands() {
      const nextCommands = await browserApiClient.get("/commands") as Command[];

      if (!cancelled) {
        setCommands(nextCommands);
      }
    }

    async function refreshDevices(deviceId?: string) {
      if (!deviceId) {
        return;
      }

      const nextDevice = await browserApiClient.get(`/devices/${deviceId}`) as Device;

      if (!cancelled) {
        setDevices((current) => [nextDevice, ...current.filter((item) => item.id !== nextDevice.id)]);
      }
    }

    async function refreshTelemetry(deviceId: string) {
      const nextTelemetry = await browserApiClient.get(`/telemetry/${deviceId}`) as never[];

      if (!cancelled) {
        const mappedTelemetry = nextTelemetry.map(toTelemetryRecord);
        setTelemetry((current) => {
          const filtered = current.filter((item) => item.deviceId !== deviceId);
          return [...mappedTelemetry, ...filtered].slice(0, 500);
        });
      }
    }

    async function refreshMapLayerState() {
      replaceMapLayers(await loadMapLayers());
    }

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
      replaceMapLayers(nextMapLayers);
      setAssetTracks(buildTrackMap(nextTrackHistory as TrackHistoryDto[], mappedTracks));
    }

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
        case "telemetry.received":
          await refreshTelemetry((payload as RealtimeEventMap["telemetry.received"]).deviceId);
          break;
        case "device.status.changed":
          await refreshDevices((payload as RealtimeEventMap["device.status.changed"]).deviceId);
          break;
        case "command.status.changed":
          await refreshCommands();
          break;
        case "alert.created":
        case "alert.updated":
          await refreshAlerts();
          break;
        case "mission.updated":
          await refreshMissions();
          break;
        case "layer.updated":
          await refreshMapLayerState();
          break;
        default:
          break;
      }
    }

    void bootstrapRuntime();

    const realtimeClient = createRealtimeClient({
      onStatusChange: setConnectionStatus,
      onEvent(event, payload) {
        if (!cancelled) {
          void handleRealtimeEvent(event, payload);
        }
      },
    });

    realtimeClient.connect();

    return () => {
      cancelled = true;
      realtimeClient.disconnect();
    };
  }, [initialBootstrap.snapshot, replaceMapLayers]);

  return {
    alerts,
    assetTracks,
    commands,
    connectionStatus,
    devices,
    geofences,
    missions,
    sessionUser,
    setAlerts,
    setCommands,
    snapshot,
    telemetry,
    tracks,
  };
}
