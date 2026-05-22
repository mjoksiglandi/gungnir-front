import { notFound, okJson, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const incident = await operationalDataGateway.getEntity("incident", id);

    if (!incident) {
      notFound("incident", id);
    }

    return okJson(incident);
  } catch (error) {
    return toErrorResponse(error);
  }
}
