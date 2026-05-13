import "server-only";

import { operationalDataGateway } from "@/shared/data/operational-data";
import type {
  FireHotspot,
  MapStageBootstrap,
} from "@/shared/contracts/operations-map";

const CHILE_FIRE_BBOX = [-74.8, -38.1, -70.6, -36.1] as const;

type ArcGisHotspotResponse = {
  features?: Array<{
    geometry?: { coordinates?: [number, number] };
    id?: number;
    properties?: {
      ACQ_DATE?: number;
      BRIGHTNESS?: number;
      CONFIDENCE?: number;
      FRP?: number;
      HOURS_OLD?: number;
      OBJECTID?: number;
    };
  }>;
};

async function getFireHotspots(): Promise<FireHotspot[]> {
  const [xmin, ymin, xmax, ymax] = CHILE_FIRE_BBOX;
  const params = new URLSearchParams({
    where: "HOURS_OLD <= 48",
    geometry: `${xmin},${ymin},${xmax},${ymax}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "OBJECTID,BRIGHTNESS,FRP,CONFIDENCE,ACQ_DATE,HOURS_OLD",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });

  try {
    const response = await fetch(
      `https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/MODIS_Thermal_v1/FeatureServer/0/query?${params.toString()}`,
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as ArcGisHotspotResponse;

    return (data.features ?? []).flatMap((feature) => {
      const coordinates = feature.geometry?.coordinates;
      const properties = feature.properties;

      if (!coordinates || !properties) {
        return [];
      }

      return [
        {
          id: feature.id ?? properties.OBJECTID ?? 0,
          lat: coordinates[1],
          lon: coordinates[0],
          brightness: properties.BRIGHTNESS ?? 0,
          confidence: properties.CONFIDENCE ?? 0,
          frp: properties.FRP ?? 0,
          hoursOld: properties.HOURS_OLD ?? 0,
          acquiredAt: properties.ACQ_DATE
            ? new Date(properties.ACQ_DATE).toISOString()
            : "",
        },
      ];
    });
  } catch {
    return [];
  }
}

export async function getOperationsMapBootstrap(): Promise<MapStageBootstrap> {
  const [snapshot, fireHotspots] = await Promise.all([
    operationalDataGateway.getSnapshot(),
    getFireHotspots(),
  ]);

  return {
    snapshot,
    fireHotspots,
    hydratedAt: new Date().toISOString(),
  };
}
