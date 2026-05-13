import { okJson } from "@/app/api/v1/_lib/http";
import { loadFireHotspotLayer } from "@/shared/geospatial/fire-hotspot-layer";

export async function GET() {
  const layer = await loadFireHotspotLayer();
  return okJson(layer);
}
