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
