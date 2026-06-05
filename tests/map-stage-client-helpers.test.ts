import type { MapLayer } from "@/types/domain";
import {
  buildAssetCounts,
  buildLayerRows,
  createInitialMapView,
  decorateMapLayerRows,
  getRelatedAlerts,
  getRelatedIncidents,
  getVisibleHazardData,
} from "@/widgets/map-stage/map-stage-client-helpers";

describe("map stage client helpers", () => {
  it("creates a clamped initial map view from query params", () => {
    const view = createInitialMapView({
      get(key: string) {
        return {
          lat: "-33.5",
          lon: "-70.6",
          zoom: "30",
        }[key] ?? null;
      },
    });

    expect(view).toEqual({
      center: [-33.5, -70.6],
      zoom: 18,
    });
  });

  it("groups asset counts by visible buckets", () => {
    const counts = buildAssetCounts([
      { assetType: "air" },
      { assetType: "ground" },
      { assetType: "personnel" },
      { assetType: "autonomous" },
      { assetType: "sensor" },
    ] as never[]);

    expect(counts).toEqual({
      air: 1,
      ground: 1,
      personnel: 1,
      maritime: 2,
    });
  });

  it("builds readable layer summaries for the control dock", () => {
    expect(buildLayerRows({
      assetCounts: {
        air: 3,
        ground: 2,
        personnel: 1,
        maritime: 1,
      },
      drawnGeofenceCount: 2,
      earthquakeCount: 4,
      geofenceLayerCount: 1,
      incidentSignalCount: 5,
      selectedAssetTrackCount: 12,
      showRoutes: true,
      wildfireCount: 7,
    })).toEqual([
      { key: "airTraffic", title: "Air disp", meta: "3 tracks" },
      { key: "earthquakes", title: "Earthquakes", meta: "4 USGS events" },
      { key: "groundTraffic", title: "Ground traffic", meta: "4 units" },
      { key: "incidents", title: "Incidents & alerts", meta: "5 local signals" },
      { key: "wildfires", title: "Wildfires", meta: "7 FIRMS hotspots" },
      { key: "routes", title: "Route mode", meta: "12 track points" },
      { key: "geofences", title: "Geofences", meta: "3 zones" },
      { key: "labels", title: "Labels", meta: "map annotations" },
    ]);
  });

  it("decorates map layer rows with loading state", () => {
    expect(decorateMapLayerRows([
      {
        id: "layer-fire-intel",
        color: "#ff6b00",
        countLabel: "10",
        icon: "F",
        title: "Active Fires",
        meta: "NASA FIRMS - 10 items",
        checked: true,
        group: "naturalHazards",
      },
    ], (layerId) => layerId === "layer-fire-intel")).toEqual([
      expect.objectContaining({
        disabled: true,
        meta: "NASA FIRMS - 10 items - loading",
      }),
    ]);
  });

  it("returns only hazard overlays that are currently visible", () => {
    const mapLayers = [{ id: "layer-earthquakes" }] as MapLayer[];

    expect(getVisibleHazardData(
      mapLayers,
      { events: [{ id: "eq-1" }] } as never,
      { hotspots: [{ id: "fire-1" }] } as never,
    )).toEqual({
      visibleEarthquakes: [{ id: "eq-1" }],
      visibleFireHotspots: [],
    });
  });

  it("finds related alerts and incidents for the selected asset", () => {
    expect(getRelatedAlerts([
      { id: "alert-1", assetId: "asset-1" },
      { id: "alert-2", assetId: "asset-2" },
    ] as never[], "asset-1")).toEqual([
      { id: "alert-1", assetId: "asset-1" },
    ]);

    expect(getRelatedIncidents([
      { id: "incident-1", assetIds: ["asset-1"] },
      { id: "incident-2", assetIds: ["asset-2"] },
    ] as never[], "asset-1")).toEqual([
      { id: "incident-1", assetIds: ["asset-1"] },
    ]);
  });
});
