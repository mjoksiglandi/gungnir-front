export interface AuthLoginDto {
  email: string;
  password: string;
}

export interface AuthRefreshDto {
  refreshToken: string;
}

export interface AuthTokenPairDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
}

export interface DeviceDto {
  id: string;
  assetId: string | null;
  deviceType: string;
  sourceType: string;
  apiKeyHash: string | null;
  externalId: string | null;
  status: "online" | "offline" | "degraded" | "retired";
  lastSeenAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TrackDto {
  id: string;
  assetId: string;
  deviceId: string;
  timestamp: string;
  lat: number;
  lon: number;
  altitudeM: number | null;
  headingDeg: number | null;
  speedMs: number | null;
  status: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
}

export interface TrackHistoryDto {
  id: string;
  assetId: string;
  deviceId: string;
  telemetryId: string | null;
  timestamp: string;
  lat: number;
  lon: number;
  headingDeg: number | null;
  speedMs: number | null;
  metadata: Record<string, unknown>;
}

export interface TelemetryDto {
  id: string;
  deviceId: string;
  assetId: string | null;
  source: string;
  timestamp: string;
  lat: number;
  lon: number;
  altitudeM: number | null;
  headingDeg: number | null;
  groundSpeedMs: number | null;
  verticalSpeedMs: number | null;
  batteryPct: number | null;
  signalQuality: number | null;
  mode: string | null;
  armed: boolean | null;
  rawPayload: Record<string, unknown>;
  createdAt: string;
}

export interface CommandDto {
  id: string;
  commandId: string;
  assetId: string | null;
  deviceId: string | null;
  type: string;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "accepted" | "rejected" | "timeout" | "failed" | "completed" | "cancelled";
  priority: number;
  issuedByUserId: string | null;
  issuedAt: string;
  expiresAt: string | null;
  ackAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  correlationData: Record<string, unknown>;
  rawResponse: Record<string, unknown> | null;
}

export interface CommandCreateDto {
  assetId?: string;
  deviceId: string;
  type: string;
  payload: Record<string, unknown>;
  priority?: number;
  expiresAt?: string;
}

export interface AlertDto {
  id: string;
  type: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  status: "open" | "acknowledged" | "resolved";
  source: string;
  assetId: string | null;
  deviceId: string | null;
  geometry: GeoJsonGeometry | null;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface MissionDto {
  id: string;
  name: string;
  status: string;
  missionType: string;
  geometry: GeoJsonGeometry | null;
  startTime: string | null;
  endTime: string | null;
  assignedUnits: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MissionUpsertDto {
  name: string;
  status: string;
  missionType: string;
  geometry?: Record<string, unknown>;
  startTime?: string;
  endTime?: string;
  assignedUnits?: string[];
  metadata?: Record<string, unknown>;
}

export interface GeofenceDto {
  id: string;
  name: string;
  geometry: GeoJsonGeometry;
  type: string;
  status: string;
  rules: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceUpsertDto {
  name: string;
  geometry: Record<string, unknown>;
  type: string;
  status: string;
  rules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface MapLayerDto {
  id: string;
  name: string;
  layerType: string;
  sourceType: "internal" | "external" | "fire-intel" | "air-traffic" | "notams" | "weather";
  enabled: boolean;
  refreshIntervalSec: number;
  ttlSec: number;
  lastUpdatedAt: string | null;
  confidence: number;
  featureCollectionUrl?: string;
  metadata: MapLayerMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface MapLayerMetadataStyle {
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  marker?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface MapLayerMetadata extends Record<string, unknown> {
  provider?: string;
  dataset?: string;
  geometryType?: string;
  style?: MapLayerMetadataStyle;
  visibleByDefault?: boolean;
}

export interface MapLayerFeatureDto {
  id: string;
  layerId: string;
  source: string;
  externalId: string | null;
  geometry: GeoJsonGeometry;
  properties: Record<string, unknown>;
  timestamp: string;
  expiresAt: string | null;
}

export interface CopAssetDto {
  id: string;
  kind: "asset";
  version: number;
  updatedAt: string;
  source: string;
  name: string;
  callsign: string;
  assetType: "air" | "ground" | "autonomous" | "personnel" | "sensor";
  status: "nominal" | "degraded" | "lost";
  affiliation: "friendly" | "neutral" | "unknown";
  position: {
    lat: number;
    lon: number;
    altM?: number;
    headingDeg?: number;
    speedMps?: number;
  };
  batteryPct?: number;
  linkQualityPct?: number;
  mission: string;
}

export interface CopAlertDto {
  id: string;
  kind: "alert";
  version: number;
  updatedAt: string;
  source: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  status: "open" | "acknowledged" | "resolved";
  title: string;
  summary: string;
  assetId?: string;
  observedAt: string;
}

export interface CopIncidentDto {
  id: string;
  kind: "incident";
  version: number;
  updatedAt: string;
  source: string;
  title: string;
  summary: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "contained" | "resolved";
  assetIds: string[];
  alertIds: string[];
  owner: string;
}

export interface CopLayerDto {
  id: string;
  kind: "geoLayer";
  version: number;
  updatedAt: string;
  source: string;
  name: string;
  layerType: "zone" | "corridor" | "route";
  visibleByDefault: boolean;
  polygon: Array<{ lat: number; lon: number }>;
}

export interface CopTimelineEventDto {
  id: string;
  timestamp: string;
  label: string;
  detail: string;
  category: "telemetry" | "alert" | "incident" | "operator";
}

export interface FireHotspotDto {
  id: string;
  source: "arcgis-nasa-modis";
  acquiredAt: string;
  brightness: number;
  confidence: number;
  frp: number;
  hoursOld: number;
  lat: number;
  lon: number;
}

export interface FireHotspotLayerDto {
  fetchedAt: string;
  hotspots: FireHotspotDto[];
  issues: Array<{
    code: "invalid-payload" | "network-error" | "timeout" | "upstream-error";
    feedId: "arcgis-nasa-modis";
    message: string;
    retryable: boolean;
  }>;
  policy: {
    allowPartialResults: boolean;
    staleAfterMs: number;
    timeoutMs: number;
  };
  sourceFeeds: Array<"arcgis-nasa-modis">;
  status: "ready" | "degraded" | "unavailable";
}

export interface CopOperationsSnapshotDto {
  assets: CopAssetDto[];
  alerts: CopAlertDto[];
  incidents: CopIncidentDto[];
  layers: CopLayerDto[];
  timeline: CopTimelineEventDto[];
}

export interface CopOperationsBootstrapDto {
  hydratedAt: string;
  snapshot: CopOperationsSnapshotDto;
  geospatial: {
    fireHotspots: FireHotspotLayerDto;
  };
}

export type GeoJsonGeometry =
  | {
      type: "Point";
      coordinates: [number, number] | [number, number, number];
    }
  | {
      type: "LineString";
      coordinates: Array<[number, number] | [number, number, number]>;
    }
  | {
      type: "Polygon";
      coordinates: Array<Array<[number, number] | [number, number, number]>>;
    }
  | {
      type: "MultiPoint";
      coordinates: Array<[number, number] | [number, number, number]>;
    }
  | {
      type: "MultiLineString";
      coordinates: Array<Array<[number, number] | [number, number, number]>>;
    }
  | {
      type: "MultiPolygon";
      coordinates: Array<Array<Array<[number, number] | [number, number, number]>>>;
    };

export interface GeoJsonFeature {
  type: "Feature";
  id?: string;
  geometry: GeoJsonGeometry | null;
  properties: Record<string, unknown>;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface RealtimeTrackUpdatedEvent {
  assetId: string;
  deviceId: string;
  timestamp: string;
  lat: number;
  lon: number;
}

export interface RealtimeTelemetryReceivedEvent {
  deviceId: string;
  assetId?: string | null;
  timestamp: string;
}

export interface RealtimeDeviceStatusChangedEvent {
  deviceId?: string;
  status?: "online" | "offline" | "degraded" | "retired";
  lastSeenAt?: string;
}

export interface RealtimeCommandStatusChangedEvent {
  commandId: string;
  status: string;
  deviceId: string;
}

export interface RealtimeAlertLifecycleEvent {
  alertId: string;
  status: string;
}

export interface RealtimeMissionUpdatedEvent {
  missionId: string;
  status: string;
}

export interface RealtimeLayerUpdatedEvent {
  layerId: string;
}

export interface BackendApiErrorPayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
