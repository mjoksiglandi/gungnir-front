import {
  buildAssetSidebarViewModel,
  getActionStatusToneLabel,
  getAssetActionIntent,
} from "@/widgets/map-stage/map-stage-asset-sidebar.helpers";
import {
  compactHazardMeta,
  compactLayerMetric,
  compactOperationalMeta,
  compactOperationalTitle,
} from "@/widgets/map-stage/map-stage-layer-panel";

describe("map stage refactor helpers", () => {
  it("classifies asset action intents", () => {
    expect(getAssetActionIntent("FOLLOW")).toBe("follow");
    expect(getAssetActionIntent("Center on map")).toBe("center");
    expect(getAssetActionIntent("Return to base")).toBe("critical");
    expect(getAssetActionIntent("Open details")).toBe("details");
  });

  it("builds sidebar action state derived flags", () => {
    const viewModel = buildAssetSidebarViewModel({
      commands: [{ id: "cmd-1", status: "queued", type: "follow" }] as never[],
      followAssetId: "asset-1",
      layerState: { routes: true } as never,
      selectedAsset: {
        id: "asset-1",
        assetType: "air",
        batteryPct: 87,
        callsign: "CONDOR-1",
        linkQualityPct: 91,
        name: "Condor",
        position: {
          headingDeg: 90,
          lat: -33.45,
          lon: -70.66,
        },
        status: "nominal",
        updatedAt: "2026-06-02T12:00:00.000Z",
      } as never,
      selectedDevice: null,
      telemetry: [],
      userLabel: "Operator",
    });

    expect(viewModel.actions.some((action) => action.isFollowActive)).toBe(true);
    expect(viewModel.actions.some((action) => action.isRouteActive)).toBe(true);
    expect(viewModel.recentCommands).toHaveLength(1);
  });

  it("formats action tone labels", () => {
    expect(getActionStatusToneLabel({ tone: "default", message: "ok" })).toBe("sent");
    expect(getActionStatusToneLabel({ tone: "warning", message: "warn" })).toBe("queued");
  });

  it("normalizes layer panel copy for compact display", () => {
    expect(compactOperationalTitle("DGAC Aerodromes", "layer-dgac-aerodromes")).toBe("AERODROMES");
    expect(compactOperationalMeta("DGAC NOTAMS - 40 items", "DGAC NOTAMS")).toBe("");
    expect(compactLayerMetric("40 items")).toBe("40 ITEMS");
    expect(compactHazardMeta("(24h)")).toBe("(24H)");
    expect(compactHazardMeta("5 min")).toBe("");
  });
});
