describe("geospatial route handlers", () => {
  it("returns cache headers for fire hotspots", async () => {
    vi.doMock("@/shared/geospatial/fire-hotspot-layer", () => ({
      loadFireHotspotLayer: vi.fn().mockResolvedValue({
        fetchedAt: "2026-06-01T00:00:00.000Z",
        hotspots: [],
        issues: [],
        policy: {
          allowPartialResults: true,
          staleAfterMs: 300000,
          timeoutMs: 10000,
        },
        sourceFeeds: ["nasa-firms-viirs"],
        status: "ready",
      }),
    }));

    const { GET } = await import("@/app/api/geospatial/fire-hotspots/route");
    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=300, stale-while-revalidate=600");
    await expect(response.json()).resolves.toMatchObject({
      status: "ready",
    });
  });

  it("returns cache headers for earthquakes", async () => {
    vi.doMock("@/shared/geospatial/earthquake-layer", () => ({
      loadEarthquakeLayer: vi.fn().mockResolvedValue({
        events: [],
        fetchedAt: "2026-06-01T00:00:00.000Z",
        issues: [],
        policy: {
          allowPartialResults: true,
          staleAfterMs: 60000,
          timeoutMs: 10000,
        },
        sourceFeeds: ["usgs-earthquakes"],
        status: "ready",
      }),
    }));

    const { GET } = await import("@/app/api/geospatial/earthquakes/route");
    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=60, stale-while-revalidate=120");
    await expect(response.json()).resolves.toMatchObject({
      status: "ready",
    });
  });
});
