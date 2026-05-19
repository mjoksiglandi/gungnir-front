import type { Alert, Asset } from "@/shared/contracts/operational";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import type { MapLayer } from "@/types/domain";

export type BasemapMode = "map" | "satellite";

export type VisibilityPreset = "operations" | "aviation" | "risk" | "clean";

export type LayerState = {
  airTraffic: boolean;
  groundTraffic: boolean;
  incidents: boolean;
  routes: boolean;
  geofences: boolean;
  heatZones: boolean;
  labels: boolean;
};

export type GeoPoint = {
  lat: number;
  lon: number;
};

export type DrawnGeofence = {
  id: string;
  name: string;
  polygon: GeoPoint[];
};

export type ActionState = {
  tone: "default" | "warning";
  message: string;
};

export type AssetTrackPoint = GeoPoint;

export type FocusRequest = {
  id: number;
  position: LatLngExpression;
};

export type MapPointTuple = LatLngTuple;

export type DeviceFilter = "all" | Asset["assetType"];

export type IncidentSignal = {
  id: string;
  title: string;
  severity: Alert["severity"];
  status: Alert["status"];
  zoneLat: number;
  zoneLon: number;
  anchorLat: number;
  anchorLon: number;
};

export type LayerRow = {
  key: keyof LayerState;
  title: string;
  meta: string;
};

export type MapLayerRow = {
  id: MapLayer["id"];
  color: string;
  title: string;
  meta: string;
  checked: boolean;
  disabled?: boolean;
};
