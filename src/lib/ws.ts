"use client";

import { io, type Socket } from "socket.io-client";
import { getBackendWsUrl } from "@/lib/api";
import type {
  RealtimeAlertLifecycleEvent,
  RealtimeCommandStatusChangedEvent,
  RealtimeDeviceStatusChangedEvent,
  RealtimeLayerUpdatedEvent,
  RealtimeMissionUpdatedEvent,
  RealtimeTelemetryReceivedEvent,
  RealtimeTrackUpdatedEvent,
} from "@/types/api";

export type RealtimeEventMap = {
  "track.updated": RealtimeTrackUpdatedEvent;
  "telemetry.received": RealtimeTelemetryReceivedEvent;
  "device.status.changed": RealtimeDeviceStatusChangedEvent;
  "command.status.changed": RealtimeCommandStatusChangedEvent;
  "alert.created": RealtimeAlertLifecycleEvent;
  "alert.updated": RealtimeAlertLifecycleEvent;
  "mission.updated": RealtimeMissionUpdatedEvent;
  "layer.updated": RealtimeLayerUpdatedEvent;
};

export type RealtimeConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export function createRealtimeClient(options: {
  onStatusChange?: (status: RealtimeConnectionStatus) => void;
  onEvent?: <K extends keyof RealtimeEventMap>(event: K, payload: RealtimeEventMap[K]) => void;
}) {
  let socket: Socket | null = null;

  function connect() {
    if (socket) {
      return socket;
    }

    options.onStatusChange?.("connecting");

    socket = io(getBackendWsUrl(), {
      autoConnect: true,
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      options.onStatusChange?.("connected");
    });

    socket.io.on("reconnect_attempt", () => {
      options.onStatusChange?.("reconnecting");
    });

    socket.on("disconnect", () => {
      options.onStatusChange?.("disconnected");
    });

    const events = [
      "track.updated",
      "telemetry.received",
      "device.status.changed",
      "command.status.changed",
      "alert.created",
      "alert.updated",
      "mission.updated",
      "layer.updated",
    ] as const;

    for (const eventName of events) {
      socket.on(eventName, (payload: RealtimeEventMap[typeof eventName]) => {
        options.onEvent?.(eventName, payload);
      });
    }

    return socket;
  }

  function disconnect() {
    socket?.disconnect();
    socket = null;
    options.onStatusChange?.("disconnected");
  }

  return {
    connect,
    disconnect,
  };
}
