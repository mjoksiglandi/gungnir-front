"use client";

import dynamic from "next/dynamic";
import type { Alert, Asset, GeoLayer, Incident } from "@/shared/contracts/operational";

const MapStageClient = dynamic(() => import("./map-stage-client").then((mod) => mod.MapStageClient), {
  ssr: false,
});

export function MapStage({
  alerts,
  assets,
  incidents,
  layers,
}: Readonly<{
  alerts: Alert[];
  assets: Asset[];
  incidents: Incident[];
  layers: GeoLayer[];
}>) {
  return (
    <MapStageClient
      alerts={alerts}
      assets={assets}
      incidents={incidents}
      layers={layers}
    />
  );
}
