import type { OperationalScenario } from "@/shared/contracts/operational";

export interface FireHotspot {
  id: number;
  lat: number;
  lon: number;
  brightness: number;
  confidence: number;
  frp: number;
  hoursOld: number;
  acquiredAt: string;
}

export interface MapStageBootstrap {
  fireHotspots: FireHotspot[];
  hydratedAt: string;
  snapshot: OperationalScenario;
}
