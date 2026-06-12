"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { browserApiClient } from "@/lib/api";
import type { RealtimeConnectionStatus } from "@/lib/ws";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import type {
  Alert,
  Command,
  Device,
  DevicePlatformType,
  Geofence,
  MapLayer,
  Mission,
  MissionAssignedDevice,
  MissionDeviceAssignment,
  TelemetryRecord,
} from "@/types/domain";
import { toOperationalAlert } from "@/types/domain";
import type { AuthUserDto, CommandCreateDto, DeviceUpsertDto, MissionUpsertDto } from "@/types/api";
import { useOperationsMapLayers } from "./use-operations-map-layers";
import { mergeAssetsWithRuntimeState, useOperationsRuntimeSync } from "./use-operations-runtime-sync";

type AssetTrackPoint = {
  lat: number;
  lon: number;
};

type OperationsRuntimeContextValue = {
  assetTracks: Record<string, AssetTrackPoint[]>;
  canConfigureDevices: boolean;
  canConfigureMissions: boolean;
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
  selectedAssetMissionAssignments: (assetId: string, deviceId?: string | null) => MissionDeviceAssignment[];
  selectedAssetTelemetry: (assetId: string) => TelemetryRecord[];
  sendCommand: (input: CommandCreateDto) => Promise<Command>;
  acknowledgeAlert: (id: string) => Promise<Alert>;
  resolveAlert: (id: string) => Promise<Alert>;
  sessionUser: AuthUserDto | null;
  updateDevicePlatformType: (device: Device, platformType: DevicePlatformType) => Promise<Device>;
  updateMissionAssignedDevice: (mission: Mission, input: MissionAssignedDevice) => Promise<Mission>;
  removeMissionAssignedDevice: (mission: Mission, deviceId: string) => Promise<Mission>;
};

const OperationsRuntimeContext = createContext<OperationsRuntimeContextValue | null>(null);

function normalizeAssignedDevices(mission: Mission) {
  return mission.assignedDevices ?? [];
}

function buildMissionUpsertPayload(mission: Mission, assignedDevices: MissionAssignedDevice[]): MissionUpsertDto {
  return {
    name: mission.name,
    status: mission.status,
    missionType: mission.missionType,
    ...(mission.geometry ? { geometry: mission.geometry as Record<string, unknown> } : {}),
    ...(mission.startTime ? { startTime: mission.startTime } : {}),
    ...(mission.endTime ? { endTime: mission.endTime } : {}),
    assignedUnits: mission.assignedUnits,
    assignedDevices,
    metadata: mission.metadata ?? {},
  };
}

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
    setDevices,
    setMissions,
    snapshot,
    telemetry,
    tracks,
  } = useOperationsRuntimeSync({
    initialBootstrap,
    replaceMapLayers,
  });

  const liveSnapshot = useMemo(() => ({
    ...snapshot,
    assets: mergeAssetsWithRuntimeState(snapshot.assets, devices, tracks, telemetry),
    alerts,
  }), [alerts, devices, snapshot, telemetry, tracks]);

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

  const missionAssignmentsByAssetId = useMemo(() => {
    const next = new Map<string, MissionDeviceAssignment[]>();
    const deviceByAssetIdMap = new Map(
      devices
        .filter((device) => device.assetId)
        .map((device) => [device.assetId as string, device]),
    );

    for (const mission of missions) {
      const assignedDevices = normalizeAssignedDevices(mission);

      for (const assetId of mission.assignedUnits) {
        const linkedDevice = deviceByAssetIdMap.get(assetId) ?? null;
        const assignment = linkedDevice
          ? assignedDevices.find((item) => item.deviceId === linkedDevice.id) ?? null
          : null;
        const current = next.get(assetId);
        const missionAssignment = {
          mission,
          assignment,
        };

        if (current) {
          current.push(missionAssignment);
        } else {
          next.set(assetId, [missionAssignment]);
        }
      }

      for (const assignment of assignedDevices) {
        const assetId = devices.find((device) => device.id === assignment.deviceId)?.assetId;

        if (!assetId) {
          continue;
        }

        const current = next.get(assetId);
        const existing = current?.find((item) => item.mission.id === mission.id);

        if (existing) {
          existing.assignment = assignment;
          continue;
        }

        const missionAssignment = {
          mission,
          assignment,
        };

        if (current) {
          current.push(missionAssignment);
        } else {
          next.set(assetId, [missionAssignment]);
        }
      }
    }

    return next;
  }, [devices, missions]);

  const telemetryByAssetId = useMemo(() => {
    const next = new Map<string, TelemetryRecord[]>();
    const assetIdByDeviceId = new Map(
      devices
        .filter((device) => device.assetId)
        .map((device) => [device.id, device.assetId as string]),
    );

    for (const item of telemetry) {
      const assetId = item.assetId ?? assetIdByDeviceId.get(item.deviceId);

      if (!assetId) {
        continue;
      }

      const current = next.get(assetId);

      if (current) {
        current.push(item);
      } else {
        next.set(assetId, [item]);
      }
    }

    for (const [assetId, items] of next.entries()) {
      next.set(assetId, [...items].sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      ));
    }

    return next;
  }, [devices, telemetry]);

  const canConfigureDevices = sessionUser?.permissions.includes("devices.configure") ?? false;
  const canConfigureMissions = sessionUser?.permissions.includes("missions.configure") ?? false;

  const updateDevicePlatformType = useCallback(async (device: Device, platformType: DevicePlatformType) => {
    const payload: DeviceUpsertDto = {
      assetId: device.assetId,
      deviceType: device.deviceType,
      sourceType: device.sourceType,
      externalId: device.externalId,
      metadata: device.metadata,
      platformType,
      P: platformType,
    };
    const updatedDevice = await browserApiClient.patch<Device>(`/devices/${device.id}`, payload);
    setDevices((current) => [updatedDevice, ...current.filter((item) => item.id !== updatedDevice.id)]);
    return updatedDevice;
  }, [setDevices]);

  const updateMissionAssignedDevice = useCallback(async (mission: Mission, input: MissionAssignedDevice) => {
    const assignedDevices = [
      ...normalizeAssignedDevices(mission).filter((item) => item.deviceId !== input.deviceId),
      input,
    ];
    const updatedMission = await browserApiClient.patch<Mission>(
      `/missions/${mission.id}`,
      buildMissionUpsertPayload(mission, assignedDevices),
    );
    setMissions((current) => [updatedMission, ...current.filter((item) => item.id !== updatedMission.id)]);
    return updatedMission;
  }, [setMissions]);

  const removeMissionAssignedDevice = useCallback(async (mission: Mission, deviceId: string) => {
    const assignedDevices = normalizeAssignedDevices(mission).filter((item) => item.deviceId !== deviceId);
    const updatedMission = await browserApiClient.patch<Mission>(
      `/missions/${mission.id}`,
      buildMissionUpsertPayload(mission, assignedDevices),
    );
    setMissions((current) => [updatedMission, ...current.filter((item) => item.id !== updatedMission.id)]);
    return updatedMission;
  }, [setMissions]);

  const value = useMemo<OperationsRuntimeContextValue>(() => ({
    assetTracks,
    canConfigureDevices,
    canConfigureMissions,
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
    selectedAssetMissionAssignments(assetId, deviceId) {
      const missionAssignments = missionAssignmentsByAssetId.get(assetId) ?? [];

      if (!deviceId) {
        return missionAssignments;
      }

      return missionAssignments.filter((item) =>
        item.assignment?.deviceId === deviceId || item.mission.assignedUnits.includes(assetId),
      );
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
    updateDevicePlatformType,
    updateMissionAssignedDevice,
    removeMissionAssignedDevice,
    sessionUser,
  }), [
    assetTracks,
    canConfigureDevices,
    canConfigureMissions,
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
    missionAssignmentsByAssetId,
    mapLayers,
    removeMissionAssignedDevice,
    sessionUser,
    setAlerts,
    setCommands,
    telemetryByAssetId,
    updateDevicePlatformType,
    updateMissionAssignedDevice,
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
