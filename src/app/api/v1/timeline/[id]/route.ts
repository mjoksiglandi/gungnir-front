import { notFound, okJson, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const timeline = await operationalDataGateway.getTimeline();
    const event = timeline.find((candidate) => candidate.id === id) ?? null;

    if (!event) {
      notFound("timeline event", id);
    }

    return okJson(event);
  } catch (error) {
    return toErrorResponse(error);
  }
}
