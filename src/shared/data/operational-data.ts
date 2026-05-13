import "server-only";

import type {
  Alert,
  Asset,
  EntityId,
  GeoLayer,
  Incident,
  IsoDateTime,
  OperationalScenario,
  TimelineEvent,
} from "@/shared/contracts/operational";
import { scenario as seedScenario } from "@/shared/mock/scenario";

type OperationalEntityMap = {
  alert: Alert;
  asset: Asset;
  geoLayer: GeoLayer;
  incident: Incident;
};

export type OperationalEntityKind = keyof OperationalEntityMap;

export type OperationalEntity = OperationalEntityMap[OperationalEntityKind];

export type OperationalStreamEvent =
  | {
      topic: "snapshot";
      type: "snapshot.replaced";
      occurredAt: IsoDateTime;
      snapshot: OperationalScenario;
    }
  | {
      topic: "timeline";
      type: "timeline.appended";
      occurredAt: IsoDateTime;
      event: TimelineEvent;
    }
  | {
      topic: OperationalEntityKind;
      type: `${OperationalEntityKind}.upserted`;
      occurredAt: IsoDateTime;
      entity: OperationalEntity;
    };

export type OperationalStreamListener = (event: OperationalStreamEvent) => void;

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

let currentScenario = cloneValue(seedScenario);

const listeners = new Set<OperationalStreamListener>();

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function nowIso() {
  return new Date().toISOString();
}

function emit(event: OperationalStreamEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

function replaceById<T extends { id: EntityId }>(items: T[], nextItem: T) {
  const nextItems = items.slice();
  const index = nextItems.findIndex((item) => item.id === nextItem.id);

  if (index === -1) {
    nextItems.push(nextItem);
    return nextItems;
  }

  nextItems[index] = nextItem;
  return nextItems;
}

async function upsertEntity<K extends OperationalEntityKind>(
  kind: K,
  entity: OperationalEntityMap[K],
): Promise<OperationalEntityMap[K]> {
  const nextEntity = cloneValue(entity);
  const occurredAt = nowIso();

  if (kind === "asset") {
    currentScenario = {
      ...currentScenario,
      assets: replaceById(currentScenario.assets, nextEntity as Asset),
    };
  } else if (kind === "alert") {
    currentScenario = {
      ...currentScenario,
      alerts: replaceById(currentScenario.alerts, nextEntity as Alert),
    };
  } else if (kind === "incident") {
    currentScenario = {
      ...currentScenario,
      incidents: replaceById(currentScenario.incidents, nextEntity as Incident),
    };
  } else {
    currentScenario = {
      ...currentScenario,
      layers: replaceById(currentScenario.layers, nextEntity as GeoLayer),
    };
  }

  emit({
    topic: kind,
    type: `${kind}.upserted`,
    occurredAt,
    entity: cloneValue(nextEntity),
  });

  return cloneValue(nextEntity);
}

export const operationalDataGateway: OperationalDataGateway = {
  async getSnapshot() {
    return cloneValue(currentScenario);
  },
  async getAssets() {
    return cloneValue(currentScenario.assets);
  },
  async getAlerts() {
    return cloneValue(currentScenario.alerts);
  },
  async getIncidents() {
    return cloneValue(currentScenario.incidents);
  },
  async getLayers() {
    return cloneValue(currentScenario.layers);
  },
  async getTimeline() {
    return cloneValue(currentScenario.timeline);
  },
  async getEntity(kind, id) {
    if (kind === "asset") {
      return cloneValue(
        (currentScenario.assets.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null,
      );
    }

    if (kind === "alert") {
      return cloneValue(
        (currentScenario.alerts.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null,
      );
    }

    if (kind === "incident") {
      return cloneValue(
        (currentScenario.incidents.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null,
      );
    }

    return cloneValue(
      (currentScenario.layers.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null,
    );
  },
  async replaceSnapshot(snapshot) {
    currentScenario = cloneValue(snapshot);

    emit({
      topic: "snapshot",
      type: "snapshot.replaced",
      occurredAt: nowIso(),
      snapshot: cloneValue(currentScenario),
    });

    return cloneValue(currentScenario);
  },
  async upsertAsset(asset) {
    return upsertEntity("asset", asset);
  },
  async upsertAlert(alert) {
    return upsertEntity("alert", alert);
  },
  async upsertIncident(incident) {
    return upsertEntity("incident", incident);
  },
  async upsertLayer(layer) {
    return upsertEntity("geoLayer", layer);
  },
  async appendTimelineEvent(event) {
    const nextEvent = cloneValue(event);

    currentScenario = {
      ...currentScenario,
      timeline: [...currentScenario.timeline, nextEvent],
    };

    emit({
      topic: "timeline",
      type: "timeline.appended",
      occurredAt: nowIso(),
      event: cloneValue(nextEvent),
    });

    return cloneValue(nextEvent);
  },
  subscribe(listener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};
