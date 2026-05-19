import "server-only";

import { cookies } from "next/headers";
import type {
  AlertDto,
  CommandCreateDto,
  CommandDto,
  CopOperationsBootstrapDto,
  CopOperationsSnapshotDto,
  DeviceDto,
  GeofenceDto,
  GeofenceUpsertDto,
  GeoJsonFeatureCollection,
  MapLayerDto,
  MapLayerFeatureDto,
  MissionDto,
  MissionUpsertDto,
  TelemetryDto,
  TrackDto,
  TrackHistoryDto,
} from "@/types/api";
import { ApiError, fetchBackend, getBackendApiBaseUrl, refreshBackendTokens } from "@/lib/api";
import { readSessionTokens } from "@/lib/auth-session";

async function parseError(response: Response) {
  let message = `Request failed with ${response.status}`;

  try {
    const payload = await response.json() as { message?: string | string[]; error?: string };
    message = Array.isArray(payload.message) ? payload.message.join(", ") : payload.message ?? payload.error ?? message;
  } catch {
    // Keep the default message when the payload is not JSON.
  }

  return new ApiError(message, response.status);
}

async function authorizedServerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const { accessToken, refreshToken } = readSessionTokens(cookieStore);

  async function execute(token: string | null) {
    return fetchBackend(`${getBackendApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        ...Object.fromEntries(new Headers(init?.headers).entries()),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
  }

  let response = await execute(accessToken);

  if (response.status === 401 && refreshToken) {
    try {
      const refreshed = await refreshBackendTokens(refreshToken);
      response = await execute(refreshed.accessToken);
    } catch {
      // Server Components can read cookies but cannot mutate them.
      // Cookie persistence/cleanup must stay in Route Handlers or Server Actions.
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return null as T;
  }

  return await response.json() as T;
}

export interface BackendApiClient {
  getOperationsBootstrap(): Promise<CopOperationsBootstrapDto>;
  getOperationsSnapshot(): Promise<CopOperationsSnapshotDto>;
  getDevices(): Promise<DeviceDto[]>;
  getDevice(id: string): Promise<DeviceDto>;
  getDeviceCurrentState(id: string): Promise<TrackDto | null>;
  getDeviceTelemetry(id: string): Promise<TelemetryDto[]>;
  getTracksCurrent(): Promise<TrackDto[]>;
  getTracksHistory(): Promise<TrackHistoryDto[]>;
  getTrack(id: string): Promise<TrackDto>;
  getTracksByBbox(query: URLSearchParams): Promise<TrackDto[]>;
  getTelemetry(): Promise<TelemetryDto[]>;
  getTelemetryByDevice(deviceId: string): Promise<TelemetryDto[]>;
  getCommands(): Promise<CommandDto[]>;
  getCommand(id: string): Promise<CommandDto>;
  createCommand(input: CommandCreateDto): Promise<CommandDto>;
  getAlerts(): Promise<AlertDto[]>;
  acknowledgeAlert(id: string): Promise<AlertDto>;
  resolveAlert(id: string): Promise<AlertDto>;
  getMissions(): Promise<MissionDto[]>;
  getMission(id: string): Promise<MissionDto>;
  createMission(input: MissionUpsertDto): Promise<MissionDto>;
  updateMission(id: string, input: MissionUpsertDto): Promise<MissionDto>;
  getGeofences(): Promise<GeofenceDto[]>;
  createGeofence(input: GeofenceUpsertDto): Promise<GeofenceDto>;
  updateGeofence(id: string, input: GeofenceUpsertDto): Promise<GeofenceDto>;
  getMapLayers(): Promise<MapLayerDto[]>;
  getMapLayer(id: string): Promise<MapLayerDto>;
  getMapLayerFeatures(id: string): Promise<MapLayerFeatureDto[]>;
  getMapLayerGeoJson(id: string): Promise<GeoJsonFeatureCollection>;
  getMe(): Promise<{ id: string; email: string; displayName: string; status: string; roles: string[] }>;
}

export const serverApiClient: BackendApiClient = {
  getOperationsBootstrap() {
    return authorizedServerRequest("/v1/operations/bootstrap");
  },
  getOperationsSnapshot() {
    return authorizedServerRequest("/v1/operations/snapshot");
  },
  getDevices() {
    return authorizedServerRequest("/devices");
  },
  getDevice(id) {
    return authorizedServerRequest(`/devices/${id}`);
  },
  getDeviceCurrentState(id) {
    return authorizedServerRequest(`/devices/${id}/current-state`);
  },
  getDeviceTelemetry(id) {
    return authorizedServerRequest(`/devices/${id}/telemetry`);
  },
  getTracksCurrent() {
    return authorizedServerRequest("/tracks/current");
  },
  getTracksHistory() {
    return authorizedServerRequest("/tracks/history");
  },
  getTrack(id) {
    return authorizedServerRequest(`/tracks/${id}`);
  },
  getTracksByBbox(query) {
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return authorizedServerRequest(`/tracks/bbox${suffix}`);
  },
  getTelemetry() {
    return authorizedServerRequest("/telemetry");
  },
  getTelemetryByDevice(deviceId) {
    return authorizedServerRequest(`/telemetry/${deviceId}`);
  },
  getCommands() {
    return authorizedServerRequest("/commands");
  },
  getCommand(id) {
    return authorizedServerRequest(`/commands/${id}`);
  },
  createCommand(input) {
    return authorizedServerRequest("/commands", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });
  },
  getAlerts() {
    return authorizedServerRequest("/alerts");
  },
  acknowledgeAlert(id) {
    return authorizedServerRequest(`/alerts/${id}/ack`, {
      method: "POST",
    });
  },
  resolveAlert(id) {
    return authorizedServerRequest(`/alerts/${id}/resolve`, {
      method: "POST",
    });
  },
  getMissions() {
    return authorizedServerRequest("/missions");
  },
  getMission(id) {
    return authorizedServerRequest(`/missions/${id}`);
  },
  createMission(input) {
    return authorizedServerRequest("/missions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });
  },
  updateMission(id, input) {
    return authorizedServerRequest(`/missions/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });
  },
  getGeofences() {
    return authorizedServerRequest("/geofences");
  },
  createGeofence(input) {
    return authorizedServerRequest("/geofences", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });
  },
  updateGeofence(id, input) {
    return authorizedServerRequest(`/geofences/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });
  },
  getMapLayers() {
    return authorizedServerRequest("/map-layers");
  },
  getMapLayer(id) {
    return authorizedServerRequest(`/map-layers/${id}`);
  },
  getMapLayerFeatures(id) {
    return authorizedServerRequest(`/map-layers/${id}/features`);
  },
  getMapLayerGeoJson(id) {
    return authorizedServerRequest(`/map-layers/${id}/geojson`);
  },
  getMe() {
    return authorizedServerRequest("/auth/me");
  },
};
