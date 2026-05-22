import { getOperationsMapBootstrap } from "@/shared/data/operations-map-bootstrap";
import { okJson } from "@/app/api/v1/_lib/http";

export async function GET() {
  const bootstrap = await getOperationsMapBootstrap();
  return okJson(bootstrap);
}
