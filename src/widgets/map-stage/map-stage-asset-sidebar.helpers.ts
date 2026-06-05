import type { Asset } from "@/shared/contracts/operational";
import type { Command, Device, TelemetryRecord } from "@/types/domain";
import {
  getQuickActions,
  getQuickHeading,
  getQuickLatLon,
  getQuickLink,
  getQuickMetrics,
  getQuickMode,
  getQuickOperator,
  getQuickReference,
  getQuickUpdate,
  getQuickVideoFeeds,
} from "./asset-quick-panel";
import type { ActionState, LayerState } from "./types";

export function getAssetActionIntent(label: string) {
  const normalized = label.toLowerCase();

  if (normalized === "follow") return "follow";
  if (normalized === "show route" || normalized === "hide route") return "route";
  if (normalized === "open details") return "details";
  if (normalized === "return to base" || normalized === "stop" || normalized === "restart") return "critical";
  if (normalized === "center on map") return "center";
  return "command";
}

export type AssetActionIntent = ReturnType<typeof getAssetActionIntent>;

export type AssetSidebarAction = ReturnType<typeof getQuickActions>[number] & {
  intent: AssetActionIntent;
  isFollowActive: boolean;
  isRouteActive: boolean;
};

export function buildAssetSidebarViewModel({
  commands,
  followAssetId,
  layerState,
  selectedAsset,
  selectedDevice,
  telemetry,
  userLabel,
}: Readonly<{
  commands: Command[];
  followAssetId: string | null;
  layerState: LayerState;
  selectedAsset: Asset;
  selectedDevice: Device | null;
  telemetry: TelemetryRecord[];
  userLabel: string;
}>) {
  const latestTelemetry = telemetry[0] ?? null;
  const actions = getQuickActions(selectedAsset);
  const viewModelActions: AssetSidebarAction[] = actions.map((action) => {
    const intent = getAssetActionIntent(action.label);

    return {
      ...action,
      intent,
      isFollowActive: action.label === "FOLLOW" && followAssetId === selectedAsset.id,
      isRouteActive: intent === "route" && layerState.routes,
    };
  });

  return {
    actions: viewModelActions,
    commandMeta: `${Math.min(commands.length, 4)} recent`,
    heading: getQuickHeading(selectedAsset.position.headingDeg),
    infoCards: [
      getQuickLink(selectedAsset, latestTelemetry, selectedDevice),
      getQuickMode(latestTelemetry),
      getQuickOperator(userLabel),
    ],
    latLonRows: getQuickLatLon(selectedAsset),
    latestTelemetry,
    metricRows: getQuickMetrics(selectedAsset, latestTelemetry, selectedDevice),
    recentCommands: commands.slice(0, 4),
    reference: getQuickReference(selectedAsset, latestTelemetry, selectedDevice),
    updateBlock: getQuickUpdate(selectedAsset, latestTelemetry),
    videoFeeds: getQuickVideoFeeds(selectedAsset, latestTelemetry, selectedDevice),
  };
}

export function getActionStatusToneLabel(actionState: ActionState) {
  return actionState.tone === "warning" ? "queued" : "sent";
}
