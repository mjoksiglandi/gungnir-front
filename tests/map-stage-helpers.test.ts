import type { GeoJsonFeature } from "@/types/api";
import { createInitialLayerState, getFeaturePopupLines, getQueryLayerIds, mapLayerVisibleByDefault, normalizeFeatureProperties } from "@/widgets/map-stage/helpers";

describe("map stage helpers", () => {
  it("enables new hazard layers in the initial state", () => {
    const layerState = createInitialLayerState([
      {
        id: "layer-1",
        kind: "geoLayer",
        layerType: "zone",
        name: "Zone",
        polygon: [],
        source: "seed",
        updatedAt: "2026-06-01T00:00:00.000Z",
        version: 1,
        visibleByDefault: true,
      },
    ]);

    expect(layerState).toMatchObject({
      earthquakes: true,
      geofences: true,
      wildfires: true,
    });
  });

  it("maps query aliases to canonical layer ids", () => {
    const ids = getQueryLayerIds("fires, weather, DAY_NIGHT,custom");

    expect([...ids]).toEqual([
      "layer-fire-intel",
      "layer-weather-hazards",
      "dayNight",
      "custom",
    ]);
  });

  it("does not enable NOTAM map layers by default without explicit metadata", () => {
    expect(mapLayerVisibleByDefault({
      enabled: true,
      id: "layer-dgac-notams",
      metadata: {
        dataset: "notams",
        provider: "dgac",
      },
      sourceType: "notams",
    })).toBe(false);
  });

  it("rebuilds split indexed GeoJSON properties", () => {
    const normalized = normalizeFeatureProperties({
      0: "{\"name\":\"SCEL\",",
      1: "\"provider\":\"DGAC\"}",
      dataset: "airport",
    });

    expect(normalized).toEqual({
      dataset: "airport",
      name: "SCEL",
      provider: "DGAC",
    });
  });

  it("formats popup lines for earthquake features", () => {
    const feature: GeoJsonFeature = {
      type: "Feature",
      geometry: null,
      properties: {
        alert: "green",
        category: "earthquake",
        depthKm: 12.4,
        felt: 3,
        magnitude: 5.7,
        observedAt: "2026-06-01T10:15:00.000Z",
        place: "Near Santiago",
        tsunami: true,
        url: "https://example.test/usgs/event",
      },
    };

    expect(getFeaturePopupLines(feature)).toEqual([
      "Magnitude: 5.7",
      "Place: Near Santiago",
      "Depth: 12.4 km",
      "Observed: 2026-06-01T10:15:00.000Z",
      "Tsunami: Yes",
      "Felt: 3",
      "Alert: green",
      "USGS: https://example.test/usgs/event",
    ]);
  });

  it("formats popup lines for NOTAM-like features", () => {
    const feature: GeoJsonFeature = {
      type: "Feature",
      geometry: null,
      properties: {
        detail: "OMKCS",
        expiresAt: "2026-06-02T03:21:31.49+00",
        pointName: "OMKCS",
        provider: "DGAC",
        radiusNm: 5,
        series: "A1234/26",
        validFrom: "2026-06-01T10:00:00.000Z",
      },
    };

    expect(getFeaturePopupLines(feature)).toEqual([
      "Detail: OMKCS",
    ]);
  });

  it("formats category=notam features with NOTAM fields instead of generic provider/expires", () => {
    const feature: GeoJsonFeature = {
      type: "Feature",
      geometry: null,
      properties: {
        category: "notam",
        detail: "WI 20NM RADIUS OF SCEL",
        expiresAt: "2026-06-02T03:21:31.49+00",
        provider: "dgac",
        series: "QFAXX",
        text: "RWY restriction",
      },
    };

    expect(getFeaturePopupLines(feature)).toEqual([
      "Detail: WI 20NM RADIUS OF SCEL",
    ]);
  });
});
