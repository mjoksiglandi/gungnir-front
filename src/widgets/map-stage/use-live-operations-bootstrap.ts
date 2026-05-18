"use client";

import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import { useOperationsRuntime } from "./operations-runtime-provider";

export function useLiveOperationsBootstrap(_bootstrap: MapStageBootstrap) {
  void _bootstrap;
  const { assetTracks, liveBootstrap } = useOperationsRuntime();

  return {
    assetTracks,
    liveBootstrap,
  };
}
