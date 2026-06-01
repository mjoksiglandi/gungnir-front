import { loadEarthquakeLayer } from "@/shared/geospatial/earthquake-layer";

describe("earthquake layer", () => {
  it("normalizes the USGS feed into earthquake events", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      features: [
        {
          geometry: {
            coordinates: [-70.65, -33.45, 18.2],
          },
          id: "us7000abcd",
          properties: {
            alert: "yellow",
            felt: 12,
            mag: 5.4,
            place: "Santiago, Chile",
            time: Date.parse("2026-06-01T12:00:00.000Z"),
            tsunami: 0,
            url: "https://earthquake.usgs.gov/example",
          },
        },
      ],
    }))));

    const layer = await loadEarthquakeLayer();

    expect(layer.status).toBe("ready");
    expect(layer.issues).toEqual([]);
    expect(layer.sourceFeeds).toEqual(["usgs-earthquakes"]);
    expect(layer.events).toEqual([
      {
        alert: "yellow",
        depthKm: 18.2,
        feltReports: 12,
        id: "us7000abcd",
        lat: -33.45,
        lon: -70.65,
        magnitude: 5.4,
        occurredAt: "2026-06-01T12:00:00.000Z",
        place: "Santiago, Chile",
        source: "usgs-earthquakes",
        tsunami: false,
        url: "https://earthquake.usgs.gov/example",
      },
    ]);
  });

  it("marks the layer unavailable when the payload has no usable events", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      features: [
        {
          geometry: {
            coordinates: [-70.65, -33.45, 18.2],
          },
          properties: {
            place: "missing magnitude and time",
          },
        },
      ],
    }))));

    const layer = await loadEarthquakeLayer();

    expect(layer.status).toBe("unavailable");
    expect(layer.events).toEqual([]);
    expect(layer.issues).toEqual([
      expect.objectContaining({
        code: "invalid-payload",
        feedId: "usgs-earthquakes",
        retryable: false,
      }),
    ]);
  });

  it("marks the layer unavailable when USGS returns an upstream error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { status: 503 })));

    const layer = await loadEarthquakeLayer();

    expect(layer.status).toBe("unavailable");
    expect(layer.events).toEqual([]);
    expect(layer.issues).toEqual([
      expect.objectContaining({
        code: "upstream-error",
        feedId: "usgs-earthquakes",
        retryable: true,
      }),
    ]);
  });

  it("marks the layer unavailable on timeout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "AbortError")));

    const layer = await loadEarthquakeLayer();

    expect(layer.status).toBe("unavailable");
    expect(layer.events).toEqual([]);
    expect(layer.issues).toEqual([
      expect.objectContaining({
        code: "timeout",
        feedId: "usgs-earthquakes",
        retryable: true,
      }),
    ]);
  });
});
