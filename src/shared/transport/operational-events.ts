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

export type OperationalEntityMap = {
  alert: Alert;
  asset: Asset;
  geoLayer: GeoLayer;
  incident: Incident;
};

export type OperationalEntityKind = keyof OperationalEntityMap;

export type OperationalEntity = OperationalEntityMap[OperationalEntityKind];

export type OperationalMutationEvent =
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

export type OperationalOrderedEvent = OperationalMutationEvent & {
  sequence: number;
};

export type OperationalStreamListener = (event: OperationalMutationEvent) => void;
export type OperationalEntityId = EntityId;
