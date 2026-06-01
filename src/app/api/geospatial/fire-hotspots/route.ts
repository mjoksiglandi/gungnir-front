import { loadFireHotspotLayer } from "@/shared/geospatial/fire-hotspot-layer";

export async function GET() {
  const layer = await loadFireHotspotLayer();
  return Response.json(layer, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
