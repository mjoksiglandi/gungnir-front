import "server-only";

import type {
  Alert,
  Asset,
  EntityId,
  GeoLayer,
  Incident,
  OperationalScenario,
  TimelineEvent,
} from "@/shared/contracts/operational";
import { mockOperationalTransport } from "@/shared/transport/mock-operational-transport";
import type {
  OperationalEntity,
  OperationalEntityKind,
  OperationalEntityMap,
  OperationalMutationEvent,
  OperationalStreamListener,
} from "@/shared/transport/operational-events";

export type OperationalStreamEvent = OperationalMutationEvent;

export interface OperationalDataGateway {
  getSnapshot(): Promise<OperationalScenario>;
  getAssets(): Promise<Asset[]>;
  getAlerts(): Promise<Alert[]>;
  getIncidents(): Promise<Incident[]>;
  getLayers(): Promise<GeoLayer[]>;
  getTimeline(): Promise<TimelineEvent[]>;
  getEntity<K extends OperationalEntityKind>(
    kind: K,
    id: EntityId,
  ): Promise<OperationalEntityMap[K] | null>;
  replaceSnapshot(snapshot: OperationalScenario): Promise<OperationalScenario>;
  upsertAsset(asset: Asset): Promise<Asset>;
  upsertAlert(alert: Alert): Promise<Alert>;
  upsertIncident(incident: Incident): Promise<Incident>;
  upsertLayer(layer: GeoLayer): Promise<GeoLayer>;
  appendTimelineEvent(event: TimelineEvent): Promise<TimelineEvent>;
  subscribe(listener: OperationalStreamListener): () => void;
}

export const operationalDataGateway: OperationalDataGateway = {
  async getSnapshot() {
    return mockOperationalTransport.getCurrentSnapshot();
  },
  async getAssets() {
    const snapshot = await mockOperationalTransport.getCurrentSnapshot();
    return snapshot.assets;
  },
  async getAlerts() {
    const snapshot = await mockOperationalTransport.getCurrentSnapshot();
    return snapshot.alerts;
  },
  async getIncidents() {
    const snapshot = await mockOperationalTransport.getCurrentSnapshot();
    return snapshot.incidents;
  },
  async getLayers() {
    const snapshot = await mockOperationalTransport.getCurrentSnapshot();
    return snapshot.layers;
  },
  async getTimeline() {
    return mockOperationalTransport.getTimeline();
  },
  async getEntity(kind, id) {
    return mockOperationalTransport.getEntity(kind, id);
  },
  async replaceSnapshot(snapshot) {
    return mockOperationalTransport.replaceSnapshot(snapshot);
  },
  async upsertAsset(asset) {
    return mockOperationalTransport.upsertAsset(asset);
  },
  async upsertAlert(alert) {
    return mockOperationalTransport.upsertAlert(alert);
  },
  async upsertIncident(incident) {
    return mockOperationalTransport.upsertIncident(incident);
  },
  async upsertLayer(layer) {
    return mockOperationalTransport.upsertLayer(layer);
  },
  async appendTimelineEvent(event) {
    return mockOperationalTransport.appendTimelineEvent(event);
  },
  subscribe(listener) {
    return mockOperationalTransport.subscribe(listener);
  },
};

export type { OperationalEntity, OperationalEntityKind };
export type { OperationalStreamListener };
