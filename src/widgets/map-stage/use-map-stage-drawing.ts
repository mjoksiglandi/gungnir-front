"use client";

import { useState } from "react";
import type { DrawnGeofence, GeoPoint } from "./types";

export function useMapStageDrawing() {
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<GeoPoint[]>([]);
  const [drawnGeofences, setDrawnGeofences] = useState<DrawnGeofence[]>([]);

  function startDrawing() {
    setDrawMode(true);
    setDrawPoints([]);
  }

  function addDrawPoint(point: GeoPoint) {
    setDrawPoints((current) => [...current, point]);
  }

  function cancelDrawing() {
    setDrawMode(false);
    setDrawPoints([]);
  }

  function finishGeofence() {
    if (drawPoints.length < 3) {
      return;
    }

    const nextId = `drawn-geofence-${drawnGeofences.length + 1}`;

    setDrawnGeofences((current) => [
      ...current,
      {
        id: nextId,
        name: `Geofence ${current.length + 1}`,
        polygon: drawPoints,
      },
    ]);
    setDrawMode(false);
    setDrawPoints([]);
  }

  return {
    addDrawPoint,
    cancelDrawing,
    drawMode,
    drawPoints,
    drawnGeofences,
    finishGeofence,
    startDrawing,
  };
}
