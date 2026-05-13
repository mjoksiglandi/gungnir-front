import dynamic from "next/dynamic";
import type { MapStageBootstrap } from "@/shared/contracts/operations-map";

const MapStageClient = dynamic(() => import("./map-stage-client").then((mod) => mod.MapStageClient), {
  ssr: false,
});

export function MapStage({
  bootstrap,
}: Readonly<{
  bootstrap: MapStageBootstrap;
}>) {
  return <MapStageClient bootstrap={bootstrap} />;
}
