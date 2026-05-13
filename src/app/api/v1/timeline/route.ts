import { okJson, readIsoDate, readEnum, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";
import type { TimelineEvent } from "@/shared/contracts/operational";

const categories = ["telemetry", "alert", "incident", "operator"] as const satisfies readonly TimelineEvent["category"][];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = readEnum(searchParams.get("category"), categories, "category");
    const since = readIsoDate(searchParams.get("since"), "since");
    const until = readIsoDate(searchParams.get("until"), "until");

    const timeline = await operationalDataGateway.getTimeline();
    const filtered = timeline.filter((event) => {
      if (category && event.category !== category) return false;
      if (since && Date.parse(event.timestamp) < Date.parse(since)) return false;
      if (until && Date.parse(event.timestamp) > Date.parse(until)) return false;
      return true;
    });

    return okJson(filtered);
  } catch (error) {
    return toErrorResponse(error);
  }
}
