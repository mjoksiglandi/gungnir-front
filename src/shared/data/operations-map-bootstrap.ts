import "server-only";

import { serverApiClient } from "@/lib/api-server";
import { toAlert, toAsset, toGeoLayer, toIncident, toTimelineEvent } from "@/types/domain";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";

export async function getOperationsMapBootstrap(): Promise<MapStageBootstrap> {
  const bootstrap = await serverApiClient.getOperationsBootstrap();

  return {
    snapshot: {
      assets: bootstrap.snapshot.assets.map(toAsset),
      alerts: bootstrap.snapshot.alerts.map(toAlert),
      incidents: bootstrap.snapshot.incidents.map(toIncident),
      layers: bootstrap.snapshot.layers.map(toGeoLayer),
      timeline: bootstrap.snapshot.timeline.map(toTimelineEvent),
    },
    geospatial: {
      fireHotspots: bootstrap.geospatial.fireHotspots,
    },
    hydratedAt: bootstrap.hydratedAt,
  };
}
