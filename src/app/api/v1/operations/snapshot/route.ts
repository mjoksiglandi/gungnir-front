import { okJson } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";

export async function GET() {
  const snapshot = await operationalDataGateway.getSnapshot();
  return okJson(snapshot);
}
