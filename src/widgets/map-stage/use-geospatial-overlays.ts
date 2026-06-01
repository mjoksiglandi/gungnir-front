"use client";

import { useEffect, useState } from "react";
import type { EarthquakeLayer, FireHotspotLayer } from "@/shared/geospatial/contracts";

type GeospatialOverlayState = {
  earthquakes: EarthquakeLayer | null;
  fireHotspots: FireHotspotLayer | null;
};

const emptyState: GeospatialOverlayState = {
  earthquakes: null,
  fireHotspots: null,
};

export function useGeospatialOverlays(initialFireHotspots: FireHotspotLayer | null) {
  const [state, setState] = useState<GeospatialOverlayState>({
    earthquakes: null,
    fireHotspots: initialFireHotspots,
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadJson<T>(url: string) {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${url} (${response.status}).`);
      }

      return response.json() as Promise<T>;
    }

    async function loadOverlays() {
      try {
        const [earthquakes, fireHotspots] = await Promise.all([
          loadJson<EarthquakeLayer>("/api/geospatial/earthquakes"),
          loadJson<FireHotspotLayer>("/api/geospatial/fire-hotspots"),
        ]);

        if (!isCancelled) {
          setState({
            earthquakes,
            fireHotspots,
          });
        }
      } catch {
        if (!isCancelled) {
          setState((current) => current === emptyState ? current : {
            earthquakes: current.earthquakes,
            fireHotspots: current.fireHotspots,
          });
        }
      }
    }

    void loadOverlays();
    const refreshId = window.setInterval(() => {
      void loadOverlays();
    }, 300_000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshId);
    };
  }, []);

  return state;
}
