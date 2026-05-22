"use client";

import dynamic from "next/dynamic";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import { OperationsRuntimeProvider } from "./map-stage/operations-runtime-provider";

const MapStageClient = dynamic(() => import("./map-stage-client").then((mod) => mod.MapStageClient), {
  ssr: false,
});

export function MapStage({
  bootstrap,
}: Readonly<{
  bootstrap: MapStageBootstrap;
}>) {
  return (
    <OperationsRuntimeProvider initialBootstrap={bootstrap}>
      <MapStageClient bootstrap={bootstrap} />
    </OperationsRuntimeProvider>
  );
}
