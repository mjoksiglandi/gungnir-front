import type { Alert, Asset, Incident } from "@/shared/contracts/operational";

type ReadonlyURLSearchParamsLike = {
  get(name: string): string | null;
};

export type OperationsSelection = {
  alertId?: string;
  assetId?: string;
  incidentId?: string;
};

function cleanId(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function getAssetDetailHref(assetId: string) {
  return `/assets/${assetId}`;
}

export function getIncidentDetailHref(incidentId: string) {
  return `/incidents/${incidentId}`;
}

export function getAlertDetailHref(alertId: string) {
  return `/alerts/${alertId}`;
}

export function buildOperationsHref(selection: OperationsSelection = {}) {
  const params = new URLSearchParams();

  if (selection.assetId) params.set("asset", selection.assetId);
  if (selection.alertId) params.set("alert", selection.alertId);
  if (selection.incidentId) params.set("incident", selection.incidentId);

  const query = params.toString();
  return query ? `/operations?${query}` : "/operations";
}

export function parseOperationsSelection(searchParams: ReadonlyURLSearchParamsLike): OperationsSelection {
  return {
    assetId: cleanId(searchParams.get("asset")),
    alertId: cleanId(searchParams.get("alert")),
    incidentId: cleanId(searchParams.get("incident")),
  };
}

export function deriveSelectionAssetId(
  selection: OperationsSelection,
  assets: Asset[],
  alerts: Alert[],
  incidents: Incident[],
) {
  if (selection.assetId && assets.some((asset) => asset.id === selection.assetId)) {
    return selection.assetId;
  }

  if (selection.alertId) {
    const alert = alerts.find((candidate) => candidate.id === selection.alertId);
    if (alert?.assetId && assets.some((asset) => asset.id === alert.assetId)) {
      return alert.assetId;
    }
  }

  if (selection.incidentId) {
    const incident = incidents.find((candidate) => candidate.id === selection.incidentId);
    const assetId = incident?.assetIds.find((candidate) => assets.some((asset) => asset.id === candidate));

    if (assetId) {
      return assetId;
    }
  }

  return "";
}
