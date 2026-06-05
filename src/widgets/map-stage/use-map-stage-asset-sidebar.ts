"use client";

import { useCallback, useMemo } from "react";
import type { Alert, Asset, Incident } from "@/shared/contracts/operational";
import type { Command, Device, Mission, TelemetryRecord } from "@/types/domain";
import { buildAssetSidebarViewModel, type AssetActionIntent } from "./map-stage-asset-sidebar.helpers";
import type { ActionState, LayerState } from "./types";

export type MapStageAssetSidebarProps = Readonly<{
  actionState: ActionState | null;
  commands: Command[];
  followAssetId: string | null;
  layerState: LayerState;
  relatedAlerts: Alert[];
  relatedIncidents: Incident[];
  relatedMissions: Mission[];
  selectedDevice: Device | null;
  selectedAsset: Asset;
  telemetry: TelemetryRecord[];
  userLabel: string;
  onAcknowledgeAlert: (id: string) => Promise<Alert>;
  onCenterOnAsset: (asset: Asset) => void;
  onClearFocus: () => void;
  onQueueCommand: (asset: Asset, commandLabel: string, tone?: ActionState["tone"]) => Promise<void>;
  onResolveAlert: (id: string) => Promise<Alert>;
  onToggleFollowAsset: (asset: Asset) => void;
  onToggleLayer: (key: keyof LayerState) => void;
}>;

function actionToneForIntent(intent: AssetActionIntent): ActionState["tone"] {
  return intent === "critical" ? "warning" : "default";
}

export function useMapStageAssetSidebar(props: MapStageAssetSidebarProps) {
  const {
    commands,
    followAssetId,
    layerState,
    selectedAsset,
    selectedDevice,
    telemetry,
    userLabel,
    onCenterOnAsset,
    onQueueCommand,
    onToggleFollowAsset,
    onToggleLayer,
  } = props;

  const viewModel = useMemo(() => buildAssetSidebarViewModel({
    commands,
    followAssetId,
    layerState,
    selectedAsset,
    selectedDevice,
    telemetry,
    userLabel,
  }), [
    commands,
    followAssetId,
    layerState,
    selectedAsset,
    selectedDevice,
    telemetry,
    userLabel,
  ]);

  const handleAction = useCallback((label: string) => {
    const action = viewModel.actions.find((candidate) => candidate.label === label);
    const intent = action?.intent ?? "command";

    if (intent === "center") {
      onCenterOnAsset(selectedAsset);
      return;
    }

    if (intent === "follow") {
      onToggleFollowAsset(selectedAsset);
      return;
    }

    if (intent === "route") {
      onToggleLayer("routes");
      return;
    }

    if (intent === "details") {
      return;
    }

    void onQueueCommand(selectedAsset, label, actionToneForIntent(intent));
  }, [
    onCenterOnAsset,
    onQueueCommand,
    onToggleFollowAsset,
    onToggleLayer,
    selectedAsset,
    viewModel.actions,
  ]);

  return {
    handleAction,
    viewModel,
  };
}
