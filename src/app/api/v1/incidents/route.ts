import { okJson, readEnum, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";
import type { Incident } from "@/shared/contracts/operational";

const priorities = ["low", "medium", "high", "urgent"] as const satisfies readonly Incident["priority"][];
const statuses = ["open", "contained", "resolved"] as const satisfies readonly Incident["status"][];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = readEnum(searchParams.get("priority"), priorities, "priority");
    const status = readEnum(searchParams.get("status"), statuses, "status");
    const assetId = searchParams.get("assetId")?.trim();
    const alertId = searchParams.get("alertId")?.trim();
    const owner = searchParams.get("owner")?.trim().toLowerCase();

    const incidents = await operationalDataGateway.getIncidents();
    const filtered = incidents.filter((incident) => {
      if (priority && incident.priority !== priority) return false;
      if (status && incident.status !== status) return false;
      if (assetId && !incident.assetIds.includes(assetId)) return false;
      if (alertId && !incident.alertIds.includes(alertId)) return false;
      if (owner && !incident.owner.toLowerCase().includes(owner)) return false;
      return true;
    });

    return okJson(filtered);
  } catch (error) {
    return toErrorResponse(error);
  }
}
