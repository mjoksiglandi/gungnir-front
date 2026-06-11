import type { Asset, Device, Track, TrackHistoryPoint } from "@/types/domain";
import {
  buildHistoryRecords,
  filterHistoryRecords,
  formatAssetTypeLabel,
  getHistoryDateRange,
  getHistorySummary,
} from "@/app/historicos/history-helpers";

describe("history helpers", () => {
  const assets: Asset[] = [
    {
      affiliation: "friendly",
      assetType: "air",
      callsign: "CONDOR-1",
      id: "asset-1",
      kind: "asset",
      mission: "Recon",
      name: "Condor Alpha",
      position: { lat: -33.4, lon: -70.6 },
      source: "seed",
      status: "nominal",
      updatedAt: "2026-06-10T13:00:00.000Z",
      version: 1,
    },
  ];
  const devices: Device[] = [
    {
      apiKeyHash: null,
      assetId: "asset-1",
      createdAt: "2026-06-10T00:00:00.000Z",
      deviceType: "uav",
      externalId: "AV-01",
      id: "device-1",
      lastSeenAt: "2026-06-10T13:00:00.000Z",
      metadata: {},
      sourceType: "telemetry",
      status: "online",
      updatedAt: "2026-06-10T13:00:00.000Z",
    },
  ];
  const currentTracks: Track[] = [
    {
      assetId: "asset-1",
      deviceId: "device-1",
      id: "track-1",
      metadata: {},
      position: { lat: -33.38, lon: -70.58 },
      status: "active",
      timestamp: "2026-06-10T13:00:00.000Z",
      updatedAt: "2026-06-10T13:00:00.000Z",
    },
  ];
  const history: TrackHistoryPoint[] = [
    {
      assetId: "asset-1",
      deviceId: "device-1",
      id: "hist-1",
      metadata: {},
      position: { lat: -33.42, lon: -70.62 },
      telemetryId: null,
      timestamp: "2026-06-09T10:00:00.000Z",
    },
    {
      assetId: "asset-1",
      deviceId: "device-1",
      id: "hist-2",
      metadata: {},
      position: { lat: -33.4, lon: -70.6 },
      telemetryId: null,
      timestamp: "2026-06-10T12:00:00.000Z",
    },
  ];

  it("builds joined history records sorted by latest timestamp", () => {
    expect(buildHistoryRecords(assets, devices, currentTracks, history)).toEqual([
      expect.objectContaining({
        asset: expect.objectContaining({ callsign: "CONDOR-1" }),
        currentTrack: expect.objectContaining({ id: "track-1" }),
        device: expect.objectContaining({ id: "device-1" }),
        points: [
          expect.objectContaining({ id: "hist-1" }),
          expect.objectContaining({ id: "hist-2" }),
        ],
      }),
    ]);
  });

  it("filters by date and text search", () => {
    const records = buildHistoryRecords(assets, devices, currentTracks, history);

    expect(filterHistoryRecords(records, {
      assetType: "all",
      fromDate: "2026-06-10",
      query: "condor",
      toDate: "2026-06-10",
    })).toEqual([
      expect.objectContaining({
        filteredPoints: [expect.objectContaining({ id: "hist-2" })],
      }),
    ]);
  });

  it("reports the available date range and summary", () => {
    expect(getHistoryDateRange(history)).toEqual({
      fromDate: "2026-06-09",
      toDate: "2026-06-10",
    });

    const filtered = filterHistoryRecords(buildHistoryRecords(assets, devices, currentTracks, history), {
      assetType: "all",
      fromDate: "2026-06-09",
      query: "",
      toDate: "2026-06-10",
    });

    expect(getHistorySummary(filtered)).toEqual({
      deviceCount: 1,
      pointCount: 2,
    });
  });

  it("formats localized asset type labels", () => {
    expect(formatAssetTypeLabel("air")).toBe("Aéreo");
    expect(formatAssetTypeLabel("all")).toBe("Todos");
  });
});
