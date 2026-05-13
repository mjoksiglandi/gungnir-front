import { notFound, okJson, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const asset = await operationalDataGateway.getEntity("asset", id);

    if (!asset) {
      notFound("asset", id);
    }

    return okJson(asset);
  } catch (error) {
    return toErrorResponse(error);
  }
}
