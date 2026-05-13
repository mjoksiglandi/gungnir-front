import type { OperationalScenario } from "@/shared/contracts/operational";
import type { GeospatialBootstrap } from "@/shared/geospatial/contracts";

export interface MapStageBootstrap {
  geospatial: GeospatialBootstrap;
  hydratedAt: string;
  snapshot: OperationalScenario;
}
