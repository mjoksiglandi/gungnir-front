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
import { serverApiClient } from "@/lib/api-server";
import { toAlert, toAsset, toGeoLayer, toIncident, toTimelineEvent } from "@/types/domain";
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
    const snapshot = await serverApiClient.getOperationsSnapshot();
    return {
      assets: snapshot.assets.map(toAsset),
      alerts: snapshot.alerts.map(toAlert),
      incidents: snapshot.incidents.map(toIncident),
      layers: snapshot.layers.map(toGeoLayer),
      timeline: snapshot.timeline.map(toTimelineEvent),
    };
  },
  async getAssets() {
    return (await this.getSnapshot()).assets;
  },
  async getAlerts() {
    return (await this.getSnapshot()).alerts;
  },
  async getIncidents() {
    return (await this.getSnapshot()).incidents;
  },
  async getLayers() {
    return (await this.getSnapshot()).layers;
  },
  async getTimeline() {
    return (await this.getSnapshot()).timeline;
  },
  async getEntity(kind, id) {
    const snapshot = await this.getSnapshot();

    switch (kind) {
      case "asset":
        return (snapshot.assets.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null;
      case "alert":
        return (snapshot.alerts.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null;
      case "incident":
        return (snapshot.incidents.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null;
      case "geoLayer":
        return (snapshot.layers.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null;
      default:
        return null;
    }
  },
  async replaceSnapshot(snapshot) {
    return snapshot;
  },
  async upsertAsset(asset) {
    return asset;
  },
  async upsertAlert(alert) {
    return alert;
  },
  async upsertIncident(incident) {
    return incident;
  },
  async upsertLayer(layer) {
    return layer;
  },
  async appendTimelineEvent(event) {
    return event;
  },
  subscribe(listener) {
    void listener;
    return () => undefined;
  },
};

export type { OperationalEntity, OperationalEntityKind };
export type { OperationalStreamListener };
