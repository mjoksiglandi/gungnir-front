"use client";

import { useMemo } from "react";
import type { Asset } from "@/shared/contracts/operational";
import type { CommandCreateDto } from "@/types/api";
import type { Device } from "@/types/domain";
import type { ActionState } from "./types";

export function useMapStageCommandQueue({
  selectedAsset,
  selectedDevice,
  sendCommand,
  setActionState,
}: Readonly<{
  selectedAsset: Asset | null;
  selectedDevice: Device | null;
  sendCommand: (input: CommandCreateDto) => Promise<{ status: string; type: string }>;
  setActionState: (state: ActionState | null) => void;
}>) {
  return useMemo(() => {
    if (!selectedAsset) {
      return null;
    }

    return async function queueCommand(commandLabel: string, tone: ActionState["tone"] = "default") {
      if (!selectedDevice) {
        setActionState({
          tone: "warning",
          message: `No linked device available for ${selectedAsset.callsign}.`,
        });
        return;
      }

      try {
        const createdCommand = await sendCommand({
          assetId: selectedAsset.id,
          deviceId: selectedDevice.id,
          payload: {
            label: commandLabel,
          },
          priority: tone === "warning" ? 8 : 5,
          type: commandLabel.toLowerCase().replace(/\s+/g, "."),
        });

        setActionState({
          tone,
          message: `${createdCommand.type} ${createdCommand.status} for ${selectedAsset.callsign}.`,
        });
      } catch {
        setActionState({
          tone: "warning",
          message: `Unable to send ${commandLabel} for ${selectedAsset.callsign}.`,
        });
      }
    };
  }, [selectedAsset, selectedDevice, sendCommand, setActionState]);
}
