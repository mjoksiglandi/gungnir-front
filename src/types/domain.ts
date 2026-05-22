import type {
  AlertDto,
  AuthUserDto,
  CommandDto,
  CopAlertDto,
  CopAssetDto,
  CopIncidentDto,
  CopLayerDto,
  CopOperationsSnapshotDto,
  CopTimelineEventDto,
  DeviceDto,
  FireHotspotDto,
  GeofenceDto,
  GeoJsonFeatureCollection,
  MapLayerDto,
  MissionDto,
  TelemetryDto,
  TrackDto,
  TrackHistoryDto,
} from "@/types/api";

export type EntityId = string;
export type IsoDateTime = string;

export type AssetType =
  | "air"
  | "ground"
  | "autonomous"
  | "personnel"
  | "sensor";

export type OperationalStatus = "nominal" | "degraded" | "lost";
export type Severity = "info" | "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "contained" | "resolved";
export type AlertStatus = "open" | "acknowledged" | "resolved";

export interface Position {
  lat: number;
  lon: number;
  altM?: number;
  headingDeg?: number;
  speedMps?: number;
}

export interface Asset {
  id: EntityId;
  kind: "asset";
  version: number;
  updatedAt: IsoDateTime;
  source: string;
  name: string;
  callsign: string;
  assetType: AssetType;
  status: OperationalStatus;
  affiliation: "friendly" | "neutral" | "unknown";
  position: Position;
  batteryPct?: number;
  linkQualityPct?: number;
  mission: string;
}

export interface Alert {
  id: EntityId;
  kind: "alert";
  version: number;
  updatedAt: IsoDateTime;
  source: string;
  severity: Severity;
  status: AlertStatus;
  title: string;
  summary: string;
  assetId?: EntityId;
  observedAt: IsoDateTime;
}

export interface Incident {
  id: EntityId;
  kind: "incident";
  version: number;
  updatedAt: IsoDateTime;
  source: string;
  title: string;
  summary: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: IncidentStatus;
  assetIds: EntityId[];
  alertIds: EntityId[];
  owner: string;
}

export interface GeoLayer {
  id: EntityId;
  kind: "geoLayer";
  version: number;
  updatedAt: IsoDateTime;
  source: string;
  name: string;
  layerType: "zone" | "corridor" | "route";
  visibleByDefault: boolean;
  polygon: Array<{ lat: number; lon: number }>;
}

export interface TimelineEvent {
  id: EntityId;
  timestamp: IsoDateTime;
  label: string;
  detail: string;
  category: "telemetry" | "alert" | "incident" | "operator";
}

export interface OperationalScenario {
  assets: Asset[];
  alerts: Alert[];
  incidents: Incident[];
  layers: GeoLayer[];
  timeline: TimelineEvent[];
}

export type AuthUser = AuthUserDto;

export type Device = DeviceDto;

export interface Track {
  id: string;
  assetId: string;
  deviceId: string;
  timestamp: string;
  position: Position;
  status: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
}

export interface TrackHistoryPoint {
  id: string;
  assetId: string;
  deviceId: string;
  telemetryId: string | null;
  timestamp: string;
  position: Position;
  metadata: Record<string, unknown>;
}

export interface TelemetryRecord {
  id: string;
  deviceId: string;
  assetId: string | null;
  source: string;
  timestamp: string;
  position: Position;
  verticalSpeedMs?: number;
  batteryPct?: number;
  signalQuality?: number;
  mode?: string;
  armed?: boolean;
  rawPayload: Record<string, unknown>;
  createdAt: string;
}

export type Command = CommandDto;

export type Mission = MissionDto;

export type Geofence = GeofenceDto;

export interface MapLayer extends MapLayerDto {
  featureCollection?: GeoJsonFeatureCollection;
}

export type FireHotspot = FireHotspotDto;

export interface OperationalRealtimeState {
  auth: {
    status: "idle" | "loading" | "authenticated" | "anonymous";
    user: AuthUser | null;
  };
  assets: Asset[];
  devices: Device[];
  tracks: Track[];
  trackHistory: TrackHistoryPoint[];
  telemetry: TelemetryRecord[];
  commands: Command[];
  alerts: Alert[];
  missions: Mission[];
  geofences: Geofence[];
  mapLayers: MapLayer[];
  timeline: TimelineEvent[];
}

const SCALE = 1_000_000;

export function toTrack(dto: TrackDto): Track {
  return {
    id: dto.id,
    assetId: dto.assetId,
    deviceId: dto.deviceId,
    timestamp: dto.timestamp,
    position: {
      lat: dto.lat / SCALE,
      lon: dto.lon / SCALE,
      altM: dto.altitudeM ?? undefined,
      headingDeg: dto.headingDeg ?? undefined,
      speedMps: dto.speedMs ?? undefined,
    },
    status: dto.status,
    metadata: dto.metadata,
    updatedAt: dto.updatedAt,
  };
}

export function toTrackHistoryPoint(dto: TrackHistoryDto): TrackHistoryPoint {
  return {
    id: dto.id,
    assetId: dto.assetId,
    deviceId: dto.deviceId,
    telemetryId: dto.telemetryId,
    timestamp: dto.timestamp,
    position: {
      lat: dto.lat / SCALE,
      lon: dto.lon / SCALE,
      headingDeg: dto.headingDeg ?? undefined,
      speedMps: dto.speedMs ?? undefined,
    },
    metadata: dto.metadata,
  };
}

export function toTelemetryRecord(dto: TelemetryDto): TelemetryRecord {
  return {
    id: dto.id,
    deviceId: dto.deviceId,
    assetId: dto.assetId,
    source: dto.source,
    timestamp: dto.timestamp,
    position: {
      lat: dto.lat / SCALE,
      lon: dto.lon / SCALE,
      altM: dto.altitudeM ?? undefined,
      headingDeg: dto.headingDeg ?? undefined,
      speedMps: dto.groundSpeedMs ?? undefined,
    },
    verticalSpeedMs: dto.verticalSpeedMs ?? undefined,
    batteryPct: dto.batteryPct ?? undefined,
    signalQuality: dto.signalQuality ?? undefined,
    mode: dto.mode ?? undefined,
    armed: dto.armed ?? undefined,
    rawPayload: dto.rawPayload,
    createdAt: dto.createdAt,
  };
}

export function toAsset(dto: CopAssetDto): Asset {
  return dto;
}

export function toAlert(dto: CopAlertDto): Alert {
  return dto;
}

export function toIncident(dto: CopIncidentDto): Incident {
  return dto;
}

export function toGeoLayer(dto: CopLayerDto): GeoLayer {
  return dto;
}

export function toTimelineEvent(dto: CopTimelineEventDto): TimelineEvent {
  return dto;
}

export function toOperationalAlert(dto: AlertDto): Alert {
  return {
    id: dto.id,
    kind: "alert",
    version: 1,
    updatedAt: dto.resolvedAt ?? dto.acknowledgedAt ?? dto.createdAt,
    source: dto.source,
    severity: dto.severity,
    status: dto.status,
    title: dto.type,
    summary: dto.message,
    assetId: dto.assetId ?? undefined,
    observedAt: dto.createdAt,
  };
}

export function toOperationalScenario(dto: CopOperationsSnapshotDto): OperationalScenario {
  return {
    assets: dto.assets.map(toAsset),
    alerts: dto.alerts.map(toAlert),
    incidents: dto.incidents.map(toIncident),
    layers: dto.layers.map(toGeoLayer),
    timeline: dto.timeline.map(toTimelineEvent),
  };
}
