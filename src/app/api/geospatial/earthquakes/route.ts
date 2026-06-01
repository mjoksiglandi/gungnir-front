import { loadEarthquakeLayer } from "@/shared/geospatial/earthquake-layer";

export async function GET() {
  const layer = await loadEarthquakeLayer();
  return Response.json(layer, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
