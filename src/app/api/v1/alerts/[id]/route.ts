import { notFound, okJson, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const alert = await operationalDataGateway.getEntity("alert", id);

    if (!alert) {
      notFound("alert", id);
    }

    return okJson(alert);
  } catch (error) {
    return toErrorResponse(error);
  }
}
