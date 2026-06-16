"use client";

import { useMemo, useState } from "react";
import type { LatLngTuple } from "leaflet";
import type { Asset } from "@/shared/contracts/operational";
import type { ActionState, AssetTrackPoint, FocusRequest } from "./types";

export function useMapStageFocus({
  assetTracks,
  assets,
  clearSelection,
  selectedAsset,
}: Readonly<{
  assetTracks: Record<string, AssetTrackPoint[]>;
  assets: Asset[];
  clearSelection: () => void;
  selectedAsset: Asset | null;
}>) {
  const [followAssetId, setFollowAssetId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [actionState, setActionState] = useState<ActionState | null>(null);

  const followedAsset = useMemo(
    () => (followAssetId ? assets.find((asset) => asset.id === followAssetId) ?? null : null),
    [assets, followAssetId],
  );
  const followTarget: LatLngTuple | null = followedAsset
    ? [followedAsset.position.lat, followedAsset.position.lon]
    : null;
  const selectedAssetTrack = useMemo(
    () =>
      selectedAsset
        ? (assetTracks[selectedAsset.id] ?? []).map<LatLngTuple>((point) => [point.lat, point.lon])
        : [],
    [assetTracks, selectedAsset],
  );

  function clearFocus() {
    clearSelection();
    setFollowAssetId(null);
  }

  function centerOnAsset(asset: Asset) {
    setFocusRequest({
      id: Date.now(),
      position: [asset.position.lat, asset.position.lon],
    });
    setActionState({
      tone: "default",
      message: `Centered on ${asset.callsign}.`,
    });
  }

  function toggleFollowAsset(asset: Asset) {
    setFollowAssetId((current) => {
      const nextFollowId = current === asset.id ? null : asset.id;

      setActionState({
        tone: "default",
        message: nextFollowId
          ? `Following ${asset.callsign} on the map.`
          : `Follow released for ${asset.callsign}.`,
      });

      if (nextFollowId) {
        setFocusRequest({
          id: Date.now(),
          position: [asset.position.lat, asset.position.lon],
        });
      }

      return nextFollowId;
    });
  }

  return {
    actionState,
    centerOnAsset,
    clearFocus,
    focusRequest,
    followAssetId,
    followTarget,
    selectedAssetTrack,
    setActionState,
    toggleFollowAsset,
  };
}
