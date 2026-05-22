import type { OperationalScenario } from "@/shared/contracts/operational";
import { scenario } from "@/shared/mock/scenario";
import type { OperationalOrderedEvent } from "@/shared/transport/operational-events";

export const scenarioSeedSnapshot: OperationalScenario = {
  assets: [],
  alerts: [],
  incidents: [],
  layers: [],
  timeline: [],
};

type ReplayCandidate = Omit<OperationalOrderedEvent, "sequence"> & {
  stableKey: string;
  stableRank: number;
};

function withoutReplayMetadata(candidate: ReplayCandidate): Omit<ReplayCandidate, "stableKey" | "stableRank"> {
  const { stableKey, stableRank, ...frame } = candidate;
  void stableKey;
  void stableRank;
  return frame;
}

function toTime(value: string) {
  return Date.parse(value);
}

function byReplayOrder(left: ReplayCandidate, right: ReplayCandidate) {
  const timeDelta = toTime(left.occurredAt) - toTime(right.occurredAt);

  if (timeDelta !== 0) return timeDelta;

  if (left.stableRank !== right.stableRank) {
    return left.stableRank - right.stableRank;
  }

  return left.stableKey.localeCompare(right.stableKey);
}

const replayCandidates: ReplayCandidate[] = [
  ...scenario.layers.map((layer) => ({
    stableKey: `geoLayer:${layer.id}`,
    stableRank: 10,
    topic: "geoLayer" as const,
    type: "geoLayer.upserted" as const,
    occurredAt: layer.updatedAt,
    entity: layer,
  })),
  ...scenario.assets.map((asset) => ({
    stableKey: `asset:${asset.id}`,
    stableRank: 20,
    topic: "asset" as const,
    type: "asset.upserted" as const,
    occurredAt: asset.updatedAt,
    entity: asset,
  })),
  ...scenario.alerts.map((alert) => ({
    stableKey: `alert:${alert.id}`,
    stableRank: 30,
    topic: "alert" as const,
    type: "alert.upserted" as const,
    occurredAt: alert.updatedAt,
    entity: alert,
  })),
  ...scenario.incidents.map((incident) => ({
    stableKey: `incident:${incident.id}`,
    stableRank: 40,
    topic: "incident" as const,
    type: "incident.upserted" as const,
    occurredAt: incident.updatedAt,
    entity: incident,
  })),
  ...scenario.timeline.map((event) => ({
    stableKey: `timeline:${event.id}`,
    stableRank: 50,
    topic: "timeline" as const,
    type: "timeline.appended" as const,
    occurredAt: event.timestamp,
    event,
  })),
];

export const scenarioReplayFrames: OperationalOrderedEvent[] = replayCandidates
  .sort(byReplayOrder)
  .map((candidate, index) => ({
    ...withoutReplayMetadata(candidate),
    sequence: index + 1,
  }) as OperationalOrderedEvent);
