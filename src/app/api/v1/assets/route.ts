import { okJson, readEnum, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";
import type { Asset } from "@/shared/contracts/operational";

const assetTypes = ["air", "ground", "autonomous", "personnel", "sensor"] as const satisfies readonly Asset["assetType"][];
const statuses = ["nominal", "degraded", "lost"] as const satisfies readonly Asset["status"][];
const affiliations = ["friendly", "neutral", "unknown"] as const satisfies readonly Asset["affiliation"][];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = readEnum(searchParams.get("assetType"), assetTypes, "assetType");
    const status = readEnum(searchParams.get("status"), statuses, "status");
    const affiliation = readEnum(searchParams.get("affiliation"), affiliations, "affiliation");
    const mission = searchParams.get("mission")?.trim().toLowerCase();

    const assets = await operationalDataGateway.getAssets();
    const filtered = assets.filter((asset) => {
      if (assetType && asset.assetType !== assetType) return false;
      if (status && asset.status !== status) return false;
      if (affiliation && asset.affiliation !== affiliation) return false;
      if (mission && !asset.mission.toLowerCase().includes(mission)) return false;
      return true;
    });

    return okJson(filtered);
  } catch (error) {
    return toErrorResponse(error);
  }
}
