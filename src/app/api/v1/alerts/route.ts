import { okJson, readEnum, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";
import type { Alert } from "@/shared/contracts/operational";

const severities = ["info", "low", "medium", "high", "critical"] as const satisfies readonly Alert["severity"][];
const statuses = ["open", "acknowledged", "resolved"] as const satisfies readonly Alert["status"][];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = readEnum(searchParams.get("severity"), severities, "severity");
    const status = readEnum(searchParams.get("status"), statuses, "status");
    const assetId = searchParams.get("assetId")?.trim();

    const alerts = await operationalDataGateway.getAlerts();
    const filtered = alerts.filter((alert) => {
      if (severity && alert.severity !== severity) return false;
      if (status && alert.status !== status) return false;
      if (assetId && alert.assetId !== assetId) return false;
      return true;
    });

    return okJson(filtered);
  } catch (error) {
    return toErrorResponse(error);
  }
}
