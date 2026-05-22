import { notFound, okJson, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const layer = await operationalDataGateway.getEntity("geoLayer", id);

    if (!layer) {
      notFound("layer", id);
    }

    return okJson(layer);
  } catch (error) {
    return toErrorResponse(error);
  }
}
