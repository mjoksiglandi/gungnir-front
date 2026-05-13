"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useMemo } from "react";
import type { Alert, Asset, Incident } from "@/shared/contracts/operational";
import {
  buildOperationsHref,
  deriveSelectionAssetId,
  parseOperationsSelection,
} from "@/shared/navigation/entity-routes";

export function useMapStageSelection({
  alerts,
  assets,
  incidents,
}: Readonly<{
  alerts: Alert[];
  assets: Asset[];
  incidents: Incident[];
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selection = useMemo(() => parseOperationsSelection(searchParams), [searchParams]);
  const selectedAssetId = deriveSelectionAssetId(selection, assets, alerts, incidents);
  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );

  function replaceOperationsSelection(nextSelection?: {
    alertId?: string;
    assetId?: string;
    incidentId?: string;
  }) {
    if (pathname !== "/operations") {
      return;
    }

    startTransition(() => {
      router.replace(buildOperationsHref(nextSelection), { scroll: false });
    });
  }

  return {
    openAsset(assetId: string) {
      replaceOperationsSelection({ assetId });
    },
    replaceOperationsSelection,
    selectedAsset,
    selectedAssetId,
    selection,
  };
}
