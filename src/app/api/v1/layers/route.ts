import { okJson, readBoolean, readEnum, toErrorResponse } from "@/app/api/v1/_lib/http";
import { operationalDataGateway } from "@/shared/data";
import type { GeoLayer } from "@/shared/contracts/operational";

const layerTypes = ["zone", "corridor", "route"] as const satisfies readonly GeoLayer["layerType"][];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const layerType = readEnum(searchParams.get("layerType"), layerTypes, "layerType");
    const visibleByDefault = readBoolean(searchParams.get("visibleByDefault"), "visibleByDefault");

    const layers = await operationalDataGateway.getLayers();
    const filtered = layers.filter((layer) => {
      if (layerType && layer.layerType !== layerType) return false;
      if (visibleByDefault !== undefined && layer.visibleByDefault !== visibleByDefault) return false;
      return true;
    });

    return okJson(filtered);
  } catch (error) {
    return toErrorResponse(error);
  }
}
