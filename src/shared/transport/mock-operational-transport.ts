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
import { scenario } from "@/shared/mock/scenario";
import {
  scenarioReplayFrames,
  scenarioSeedSnapshot,
} from "@/shared/mock/scenario-replay";
import type {
  OperationalEntityKind,
  OperationalEntityMap,
  OperationalMutationEvent,
  OperationalOrderedEvent,
  OperationalStreamListener,
} from "@/shared/transport/operational-events";

export type ReplayStatus = "idle" | "running" | "paused" | "completed";

export interface ReplayState {
  cursor: number;
  nextSequence: number | null;
  speed: number;
  status: ReplayStatus;
  totalFrames: number;
}

export type ReplayControlEvent =
  | {
      type: "replay.started";
      state: ReplayState;
    }
  | {
      type: "replay.paused";
      state: ReplayState;
    }
  | {
      type: "replay.reset";
      state: ReplayState;
    }
  | {
      type: "replay.completed";
      state: ReplayState;
    }
  | {
      type: "replay.speed.changed";
      state: ReplayState;
    }
  | {
      type: "replay.stepped";
      applied: number;
      state: ReplayState;
    };

export type ReplayListener = (event: ReplayControlEvent) => void;

export interface MockOperationalTransport {
  getBootstrapSnapshot(): Promise<OperationalScenario>;
  getCurrentSnapshot(): Promise<OperationalScenario>;
  getTimeline(): Promise<TimelineEvent[]>;
  getEntity<K extends OperationalEntityKind>(
    kind: K,
    id: EntityId,
  ): Promise<OperationalEntityMap[K] | null>;
  getReplayFrames(): Promise<OperationalOrderedEvent[]>;
  getReplayState(): ReplayState;
  startReplay(): void;
  pauseReplay(): void;
  stepReplay(frameCount?: number): number;
  setReplaySpeed(speed: number): number;
  resetReplay(): Promise<OperationalScenario>;
  replaceSnapshot(snapshot: OperationalScenario): Promise<OperationalScenario>;
  upsertAsset(asset: Asset): Promise<Asset>;
  upsertAlert(alert: Alert): Promise<Alert>;
  upsertIncident(incident: Incident): Promise<Incident>;
  upsertLayer(layer: GeoLayer): Promise<GeoLayer>;
  appendTimelineEvent(event: TimelineEvent): Promise<TimelineEvent>;
  subscribe(listener: OperationalStreamListener): () => void;
  subscribeReplay(listener: ReplayListener): () => void;
}

let currentSnapshot = cloneValue(scenario);
let replayCursor = scenarioReplayFrames.length;
let replayStatus: ReplayStatus = "completed";
let replaySpeed = 1;
let dynamicSequence = scenarioReplayFrames.length;
let replayTimer: ReturnType<typeof setTimeout> | null = null;

const mutationListeners = new Set<OperationalStreamListener>();
const replayListeners = new Set<ReplayListener>();
const assetOrder = new Map(scenario.assets.map((item, index) => [item.id, index]));
const alertOrder = new Map(scenario.alerts.map((item, index) => [item.id, index]));
const incidentOrder = new Map(scenario.incidents.map((item, index) => [item.id, index]));
const layerOrder = new Map(scenario.layers.map((item, index) => [item.id, index]));

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function toTime(value: string) {
  return Date.parse(value);
}

function getFrameAt(cursor: number) {
  return scenarioReplayFrames[cursor] ?? null;
}

function getCurrentState(): ReplayState {
  return {
    cursor: replayCursor,
    nextSequence: getFrameAt(replayCursor)?.sequence ?? null,
    speed: replaySpeed,
    status: replayStatus,
    totalFrames: scenarioReplayFrames.length,
  };
}

function emitMutation(event: OperationalMutationEvent) {
  for (const listener of mutationListeners) {
    listener(cloneValue(event));
  }
}

function emitReplay(event: ReplayControlEvent) {
  for (const listener of replayListeners) {
    listener(cloneValue(event));
  }
}

function stopTimer() {
  if (replayTimer) {
    clearTimeout(replayTimer);
    replayTimer = null;
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

function byCanonicalOrder<T extends { id: EntityId }>(order: Map<EntityId, number>) {
  return (left: T, right: T) => {
    const leftRank = order.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = order.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  };
}

function applyMutation(event: OperationalMutationEvent) {
  if (event.topic === "snapshot") {
    currentSnapshot = cloneValue(event.snapshot);
    return;
  }

  if (event.topic === "timeline") {
    currentSnapshot = {
      ...currentSnapshot,
      timeline: [...currentSnapshot.timeline, cloneValue(event.event)],
    };
    return;
  }

  if (event.topic === "asset") {
    currentSnapshot = {
      ...currentSnapshot,
      assets: replaceById(currentSnapshot.assets, cloneValue(event.entity as Asset)).sort(byCanonicalOrder(assetOrder)),
    };
    return;
  }

  if (event.topic === "alert") {
    currentSnapshot = {
      ...currentSnapshot,
      alerts: replaceById(currentSnapshot.alerts, cloneValue(event.entity as Alert)).sort(byCanonicalOrder(alertOrder)),
    };
    return;
  }

  if (event.topic === "incident") {
    currentSnapshot = {
      ...currentSnapshot,
      incidents: replaceById(currentSnapshot.incidents, cloneValue(event.entity as Incident)).sort(byCanonicalOrder(incidentOrder)),
    };
    return;
  }

  currentSnapshot = {
    ...currentSnapshot,
    layers: replaceById(currentSnapshot.layers, cloneValue(event.entity as GeoLayer)).sort(byCanonicalOrder(layerOrder)),
  };
}

function toMutationEvent(frame: OperationalOrderedEvent): OperationalMutationEvent {
  const { sequence, ...event } = frame;
  void sequence;
  return cloneValue(event);
}

function applyReplayFrame(frame: OperationalOrderedEvent) {
  const mutation = toMutationEvent(frame);
  applyMutation(mutation);
  emitMutation(mutation);
  replayCursor += 1;
  dynamicSequence = Math.max(dynamicSequence, frame.sequence);
}

function completeReplayIfNeeded() {
  if (replayCursor < scenarioReplayFrames.length) return false;

  stopTimer();
  replayStatus = "completed";
  emitReplay({
    type: "replay.completed",
    state: getCurrentState(),
  });
  return true;
}

function computeDelayMs(cursor: number) {
  if (cursor <= 0) return 0;

  const current = getFrameAt(cursor);
  const previous = getFrameAt(cursor - 1);

  if (!current || !previous) return 0;

  const deltaMs = Math.max(0, toTime(current.occurredAt) - toTime(previous.occurredAt));
  return Math.max(0, Math.round(deltaMs / replaySpeed));
}

function scheduleNextFrame() {
  stopTimer();

  if (completeReplayIfNeeded()) return;

  const delayMs = computeDelayMs(replayCursor);

  replayTimer = setTimeout(() => {
    const frame = getFrameAt(replayCursor);

    if (!frame) {
      completeReplayIfNeeded();
      return;
    }

    applyReplayFrame(frame);

    if (!completeReplayIfNeeded() && replayStatus === "running") {
      scheduleNextFrame();
    }
  }, delayMs);
}

function nextDynamicSequence() {
  dynamicSequence += 1;
  return dynamicSequence;
}

function nowIso() {
  return new Date().toISOString();
}

function buildEntityEvent<K extends OperationalEntityKind>(
  kind: K,
  entity: OperationalEntityMap[K],
): OperationalOrderedEvent {
  const nextEntity = cloneValue(entity);

  return {
    sequence: nextDynamicSequence(),
    topic: kind,
    type: `${kind}.upserted`,
    occurredAt: nextEntity.updatedAt,
    entity: nextEntity,
  };
}

function buildTimelineEvent(event: TimelineEvent): OperationalOrderedEvent {
  return {
    sequence: nextDynamicSequence(),
    topic: "timeline",
    type: "timeline.appended",
    occurredAt: event.timestamp,
    event: cloneValue(event),
  };
}

async function upsertEntity<K extends OperationalEntityKind>(
  kind: K,
  entity: OperationalEntityMap[K],
): Promise<OperationalEntityMap[K]> {
  const orderedEvent = buildEntityEvent(kind, entity);
  const mutation = toMutationEvent(orderedEvent);

  applyMutation(mutation);
  emitMutation(mutation);

  return cloneValue(entity);
}

export const mockOperationalTransport: MockOperationalTransport = {
  async getBootstrapSnapshot() {
    return cloneValue(scenarioSeedSnapshot);
  },
  async getCurrentSnapshot() {
    return cloneValue(currentSnapshot);
  },
  async getTimeline() {
    return cloneValue(currentSnapshot.timeline);
  },
  async getEntity(kind, id) {
    if (kind === "asset") {
      return cloneValue(
        (currentSnapshot.assets.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null,
      );
    }

    if (kind === "alert") {
      return cloneValue(
        (currentSnapshot.alerts.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null,
      );
    }

    if (kind === "incident") {
      return cloneValue(
        (currentSnapshot.incidents.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null,
      );
    }

    return cloneValue(
      (currentSnapshot.layers.find((item) => item.id === id) ?? null) as OperationalEntityMap[typeof kind] | null,
    );
  },
  async getReplayFrames() {
    return cloneValue(scenarioReplayFrames);
  },
  getReplayState() {
    return getCurrentState();
  },
  startReplay() {
    if (replayStatus === "completed") return;

    replayStatus = "running";
    emitReplay({
      type: "replay.started",
      state: getCurrentState(),
    });
    scheduleNextFrame();
  },
  pauseReplay() {
    if (replayStatus !== "running") return;

    stopTimer();
    replayStatus = "paused";
    emitReplay({
      type: "replay.paused",
      state: getCurrentState(),
    });
  },
  stepReplay(frameCount = 1) {
    stopTimer();

    if (replayStatus === "completed") return 0;

    replayStatus = replayCursor === 0 ? "idle" : "paused";

    let applied = 0;

    while (applied < frameCount) {
      const frame = getFrameAt(replayCursor);

      if (!frame) break;

      applyReplayFrame(frame);
      applied += 1;
    }

    if (!completeReplayIfNeeded()) {
      emitReplay({
        type: "replay.stepped",
        applied,
        state: getCurrentState(),
      });
    }

    return applied;
  },
  setReplaySpeed(speed) {
    if (!Number.isFinite(speed) || speed <= 0) {
      throw new Error("Replay speed must be a finite number greater than 0.");
    }

    replaySpeed = speed;

    emitReplay({
      type: "replay.speed.changed",
      state: getCurrentState(),
    });

    if (replayStatus === "running") {
      scheduleNextFrame();
    }

    return replaySpeed;
  },
  async resetReplay() {
    stopTimer();
    replayCursor = 0;
    replayStatus = "idle";
    dynamicSequence = scenarioReplayFrames.length;
    currentSnapshot = cloneValue(scenarioSeedSnapshot);

    emitMutation({
      topic: "snapshot",
      type: "snapshot.replaced",
      occurredAt: nowIso(),
      snapshot: cloneValue(currentSnapshot),
    });

    emitReplay({
      type: "replay.reset",
      state: getCurrentState(),
    });

    return cloneValue(currentSnapshot);
  },
  async replaceSnapshot(snapshot) {
    stopTimer();
    replayStatus = "paused";

    const event: OperationalOrderedEvent = {
      sequence: nextDynamicSequence(),
      topic: "snapshot",
      type: "snapshot.replaced",
      occurredAt: nowIso(),
      snapshot: cloneValue(snapshot),
    };

    const mutation = toMutationEvent(event);
    applyMutation(mutation);
    emitMutation(mutation);

    return cloneValue(currentSnapshot);
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
    const orderedEvent = buildTimelineEvent(event);
    const mutation = toMutationEvent(orderedEvent);

    applyMutation(mutation);
    emitMutation(mutation);

    return cloneValue(event);
  },
  subscribe(listener) {
    mutationListeners.add(listener);

    return () => {
      mutationListeners.delete(listener);
    };
  },
  subscribeReplay(listener) {
    replayListeners.add(listener);

    return () => {
      replayListeners.delete(listener);
    };
  },
};
