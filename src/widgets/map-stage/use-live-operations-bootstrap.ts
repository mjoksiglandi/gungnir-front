"use client";

import { useEffect, useState } from "react";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import { buildInitialTracks, mergeAssetTracks } from "./helpers";

export function useLiveOperationsBootstrap(bootstrap: MapStageBootstrap) {
  const [liveBootstrap, setLiveBootstrap] = useState(() => bootstrap);
  const [assetTracks, setAssetTracks] = useState(() => buildInitialTracks(bootstrap.snapshot.assets));

  useEffect(() => {
    let cancelled = false;

    async function refreshBootstrap() {
      try {
        const response = await fetch("/api/v1/operations/bootstrap", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const nextBootstrap = await response.json() as MapStageBootstrap;

        if (!cancelled) {
          setAssetTracks((current) => mergeAssetTracks(current, nextBootstrap.snapshot.assets));
          setLiveBootstrap(nextBootstrap);
        }
      } catch {
        // Keep the last known bootstrap when polling fails.
      }
    }

    void refreshBootstrap();

    const pollHandle = window.setInterval(() => {
      void refreshBootstrap();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(pollHandle);
    };
  }, []);

  return {
    assetTracks,
    liveBootstrap,
  };
}
