import type { Asset, AssetType, Device, Track, TrackHistoryPoint } from "@/types/domain";

export type HistoryAssetTypeFilter = "all" | AssetType;

export type HistoryFilters = {
  assetType: HistoryAssetTypeFilter;
  fromDate: string;
  query: string;
  toDate: string;
};

export type HistoryRecord = {
  asset: Asset;
  currentTrack: Track | null;
  device: Device | null;
  deviceId: string;
  points: TrackHistoryPoint[];
};

export type FilteredHistoryRecord = HistoryRecord & {
  filteredPoints: TrackHistoryPoint[];
  lastPoint: TrackHistoryPoint;
};

function compareIsoTimestamp(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function getTimestampDate(value: string) {
  return value.slice(0, 10);
}

export function getHistoryDateRange(history: TrackHistoryPoint[]) {
  if (history.length === 0) {
    return {
      fromDate: "",
      toDate: "",
    };
  }

  const timestamps = history.map((point) => getTimestampDate(point.timestamp)).sort();

  return {
    fromDate: timestamps[0],
    toDate: timestamps[timestamps.length - 1],
  };
}

export function buildHistoryRecords(
  assets: Asset[],
  devices: Device[],
  currentTracks: Track[],
  history: TrackHistoryPoint[],
) {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const deviceById = new Map(devices.map((device) => [device.id, device]));
  const trackByDeviceId = new Map(currentTracks.map((track) => [track.deviceId, track]));
  const pointsByDeviceId = new Map<string, TrackHistoryPoint[]>();

  for (const point of history) {
    const current = pointsByDeviceId.get(point.deviceId);

    if (current) {
      current.push(point);
    } else {
      pointsByDeviceId.set(point.deviceId, [point]);
    }
  }

  return [...pointsByDeviceId.entries()]
    .map(([deviceId, points]) => {
      const sortedPoints = [...points].sort((left, right) => compareIsoTimestamp(left.timestamp, right.timestamp));
      const lastPoint = sortedPoints[sortedPoints.length - 1];
      const device = deviceById.get(deviceId) ?? null;
      const asset = assetById.get(lastPoint.assetId) ?? (device?.assetId ? assetById.get(device.assetId) : undefined);

      if (!asset) {
        return null;
      }

      return {
        asset,
        currentTrack: trackByDeviceId.get(deviceId) ?? null,
        device,
        deviceId,
        points: sortedPoints,
      } satisfies HistoryRecord;
    })
    .filter((record): record is HistoryRecord => record !== null)
    .sort((left, right) => compareIsoTimestamp(
      right.points[right.points.length - 1].timestamp,
      left.points[left.points.length - 1].timestamp,
    ));
}

export function filterHistoryRecords(records: HistoryRecord[], filters: HistoryFilters) {
  const normalizedQuery = normalizeQuery(filters.query);

  return records.flatMap((record) => {
    if (filters.assetType !== "all" && record.asset.assetType !== filters.assetType) {
      return [];
    }

    if (normalizedQuery) {
      const searchValue = [
        record.asset.callsign,
        record.asset.name,
        record.device?.externalId,
        record.device?.deviceType,
        record.deviceId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchValue.includes(normalizedQuery)) {
        return [];
      }
    }

    const filteredPoints = record.points.filter((point) => {
      const pointDate = getTimestampDate(point.timestamp);
      return (!filters.fromDate || pointDate >= filters.fromDate)
        && (!filters.toDate || pointDate <= filters.toDate);
    });

    if (filteredPoints.length === 0) {
      return [];
    }

    return [{
      ...record,
      filteredPoints,
      lastPoint: filteredPoints[filteredPoints.length - 1],
    } satisfies FilteredHistoryRecord];
  });
}

export function formatAssetTypeLabel(assetType: HistoryAssetTypeFilter) {
  switch (assetType) {
    case "air":
      return "Aéreo";
    case "ground":
      return "Terrestre";
    case "autonomous":
      return "Autónomo";
    case "personnel":
      return "Personal";
    case "sensor":
      return "Sensor";
    default:
      return "Todos";
  }
}

export function getHistorySummary(records: FilteredHistoryRecord[]) {
  return {
    deviceCount: records.length,
    pointCount: records.reduce((total, record) => total + record.filteredPoints.length, 0),
  };
}
