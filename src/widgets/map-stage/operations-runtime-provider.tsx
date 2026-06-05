"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { browserApiClient } from "@/lib/api";
import type { RealtimeConnectionStatus } from "@/lib/ws";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import type { Alert, Command, Device, Geofence, MapLayer, Mission, TelemetryRecord } from "@/types/domain";
import { toOperationalAlert } from "@/types/domain";
import type { AuthUserDto, CommandCreateDto } from "@/types/api";
import { useOperationsMapLayers } from "./use-operations-map-layers";
import { mergeAssetsWithRuntimeState, useOperationsRuntimeSync } from "./use-operations-runtime-sync";

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

export function OperationsRuntimeProvider({
  children,
  initialBootstrap,
}: Readonly<{
  children: ReactNode;
  initialBootstrap: MapStageBootstrap;
}>) {
  const {
    ensureMapLayerFeatureCollection,
    isMapLayerLoading,
    mapLayers,
    replaceMapLayers,
  } = useOperationsMapLayers(initialBootstrap);
  const {
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
  } = useOperationsRuntimeSync({
    initialBootstrap,
    replaceMapLayers,
  });

  const liveSnapshot = useMemo(() => ({
    ...snapshot,
    assets: mergeAssetsWithRuntimeState(snapshot.assets, tracks, telemetry),
    alerts,
  }), [alerts, snapshot, telemetry, tracks]);

  const deviceByAssetId = useMemo(() => {
    return new Map(devices.map((device) => [device.assetId, device]));
  }, [devices]);

  const commandsByAssetId = useMemo(() => {
    const next = new Map<string, Command[]>();
    const assetIdByDeviceId = new Map(devices.map((device) => [device.id, device.assetId]));

    for (const command of commands) {
      const assetId = command.assetId ?? (command.deviceId ? assetIdByDeviceId.get(command.deviceId) : undefined);

      if (assetId) {
        const current = next.get(assetId);

        if (current) {
          current.push(command);
        } else {
          next.set(assetId, [command]);
        }
      }
    }

    return next;
  }, [commands, devices]);

  const missionsByAssetId = useMemo(() => {
    const next = new Map<string, Mission[]>();

    for (const mission of missions) {
      for (const assetId of mission.assignedUnits) {
        const current = next.get(assetId);

        if (current) {
          current.push(mission);
        } else {
          next.set(assetId, [mission]);
        }
      }
    }

    return next;
  }, [missions]);

  const telemetryByAssetId = useMemo(() => {
    const next = new Map<string, TelemetryRecord[]>();

    for (const item of telemetry) {
      if (!item.assetId) {
        continue;
      }

      const current = next.get(item.assetId);

      if (current) {
        current.push(item);
      } else {
        next.set(item.assetId, [item]);
      }
    }

    return next;
  }, [telemetry]);

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
    isMapLayerLoading,
    selectedAssetCommands(assetId) {
      return commandsByAssetId.get(assetId) ?? [];
    },
    selectedAssetDevice(assetId) {
      return deviceByAssetId.get(assetId) ?? null;
    },
    selectedAssetMissions(assetId) {
      return missionsByAssetId.get(assetId) ?? [];
    },
    selectedAssetTelemetry(assetId) {
      return telemetryByAssetId.get(assetId) ?? [];
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
    commandsByAssetId,
    connectionStatus,
    devices,
    deviceByAssetId,
    ensureMapLayerFeatureCollection,
    geofences,
    initialBootstrap,
    isMapLayerLoading,
    missions,
    missionsByAssetId,
    mapLayers,
    sessionUser,
    setAlerts,
    setCommands,
    telemetryByAssetId,
    liveSnapshot,
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
