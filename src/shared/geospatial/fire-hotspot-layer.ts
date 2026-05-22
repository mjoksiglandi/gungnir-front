import "server-only";

import {
  defaultFeedPolicy,
  fetchArcGisNasaHotspots,
} from "@/shared/feeds/arcgis-nasa-hotspots";
import type {
  FireHotspotLayer,
  GeospatialFeedPolicy,
} from "@/shared/geospatial/contracts";

export async function loadFireHotspotLayer(
  policy: GeospatialFeedPolicy = defaultFeedPolicy,
): Promise<FireHotspotLayer> {
  const result = await fetchArcGisNasaHotspots(policy);
  const hasIssues = result.issues.length > 0;
  const hasHotspots = result.hotspots.length > 0;

  return {
    fetchedAt: result.fetchedAt,
    hotspots: result.hotspots,
    issues: result.issues,
    policy,
    sourceFeeds: [result.feedId],
    status: hasIssues
      ? hasHotspots && policy.allowPartialResults
        ? "degraded"
        : "unavailable"
      : "ready",
  };
}
