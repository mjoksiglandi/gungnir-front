import "server-only";

import { operationalDataGateway } from "@/shared/data/operational-data";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";
import { loadFireHotspotLayer } from "@/shared/geospatial/fire-hotspot-layer";

export async function getOperationsMapBootstrap(): Promise<MapStageBootstrap> {
  const [snapshot, fireHotspots] = await Promise.all([
    operationalDataGateway.getSnapshot(),
    loadFireHotspotLayer(),
  ]);

  return {
    snapshot,
    geospatial: {
      fireHotspots,
    },
    hydratedAt: new Date().toISOString(),
  };
}
