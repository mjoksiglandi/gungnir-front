import type { IsoDateTime } from "@/shared/contracts/operational";
import type { OperationalOrderedEvent } from "@/shared/transport/operational-events";

export const WEBSOCKET_PROTOCOL_VERSION = "v1" as const;
export const OPERATIONS_STREAM_SUBPROTOCOL = "gugnir.operations.v1" as const;

export type WebSocketProtocolVersion = typeof WEBSOCKET_PROTOCOL_VERSION;
export type OperationsStreamSubprotocol = typeof OPERATIONS_STREAM_SUBPROTOCOL;
export type OperationsStreamMode = "live" | "replay";
export type OperationsStreamName = "operations";
export type ReplayStatus = "idle" | "running" | "paused" | "completed";
export type StreamErrorCode =
  | "invalid_resume"
  | "unsupported_mode"
  | "unsupported_protocol";

export interface ReplayStateSnapshot {
  cursor: number;
  nextSequence: number | null;
  speed: number;
  status: ReplayStatus;
  totalFrames: number;
}

export interface OperationsHelloFrame {
  frameKind: "hello";
  protocolVersion: WebSocketProtocolVersion;
  stream: OperationsStreamName;
  connectionId: string;
  emittedAt: IsoDateTime;
  mode: OperationsStreamMode;
  replay: {
    nextSequence: number | null;
    supportsResume: boolean;
    supportsReplay: boolean;
    state?: ReplayStateSnapshot;
  };
  rest: {
    bootstrapPath: "/api/v1/operations/bootstrap";
    snapshotPath: "/api/v1/operations/snapshot";
  };
}

export interface OperationsMutationFrame {
  frameKind: "mutation";
  protocolVersion: WebSocketProtocolVersion;
  stream: OperationsStreamName;
  eventId: string;
  emittedAt: IsoDateTime;
  event: OperationalOrderedEvent;
}

export type ReplayControlFrame =
  | {
      frameKind: "replay";
      protocolVersion: WebSocketProtocolVersion;
      stream: OperationsStreamName;
      eventId: string;
      emittedAt: IsoDateTime;
      type: "replay.started" | "replay.paused" | "replay.reset" | "replay.completed" | "replay.speed.changed";
      state: ReplayStateSnapshot;
    }
  | {
      frameKind: "replay";
      protocolVersion: WebSocketProtocolVersion;
      stream: OperationsStreamName;
      eventId: string;
      emittedAt: IsoDateTime;
      type: "replay.stepped";
      applied: number;
      state: ReplayStateSnapshot;
    };

export interface OperationsStreamErrorFrame {
  frameKind: "error";
  protocolVersion: WebSocketProtocolVersion;
  stream: OperationsStreamName;
  eventId: string;
  emittedAt: IsoDateTime;
  error: {
    code: StreamErrorCode;
    message: string;
    retryable: boolean;
  };
}

export type OperationsStreamFrame =
  | OperationsHelloFrame
  | OperationsMutationFrame
  | ReplayControlFrame
  | OperationsStreamErrorFrame;
