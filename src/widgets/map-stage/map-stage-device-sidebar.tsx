"use client";

import type { CSSProperties } from "react";
import type { Asset } from "@/shared/contracts/operational";
import { formatSpeedKph } from "@/shared/lib/format";
import { statusColor } from "./helpers";
import type { DeviceFilter } from "./types";
import styles from "../map-stage.module.css";

type AssetCounts = Record<"air" | "ground" | "personnel", number>;

export function MapStageDeviceSidebar({
  assetCounts,
  assetsTotal,
  deviceFilter,
  filteredAssets,
  searchQuery,
  selectedAssetId,
  onClose,
  onDeviceFilterChange,
  onOpenAsset,
  onSearchQueryChange,
}: Readonly<{
  assetCounts: AssetCounts;
  assetsTotal: number;
  deviceFilter: DeviceFilter;
  filteredAssets: Asset[];
  searchQuery: string;
  selectedAssetId: string | null;
  onClose: () => void;
  onDeviceFilterChange: (value: DeviceFilter) => void;
  onOpenAsset: (assetId: string) => void;
  onSearchQueryChange: (value: string) => void;
}>) {
  return (
    <aside className={styles.deviceSidebar} id="device-sidebar">
      <div className={styles.sidebarHeader}>
        <div>
          <span className={styles.panelLabel}>Devices</span>
          <h2 className={styles.sidebarTitle}>Operational assets</h2>
        </div>
        <button className={styles.closeButton} onClick={onClose} type="button">
          Close
        </button>
      </div>

      <div className={styles.searchShell}>
        <input
          aria-label="Search operational devices"
          className={styles.searchInput}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search devices..."
          value={searchQuery}
        />
        <button aria-label={`${filteredAssets.length} devices in current filter`} className={styles.filterButton} type="button">
          {filteredAssets.length}
        </button>
      </div>

      <div className={styles.deviceTabs}>
        <button
          aria-pressed={deviceFilter === "all"}
          className={`${styles.deviceTab} ${deviceFilter === "all" ? styles.deviceTabActive : ""}`}
          onClick={() => onDeviceFilterChange("all")}
          type="button"
        >
          All {assetsTotal}
        </button>
        <button
          aria-pressed={deviceFilter === "air"}
          className={`${styles.deviceTab} ${deviceFilter === "air" ? styles.deviceTabActive : ""}`}
          onClick={() => onDeviceFilterChange("air")}
          type="button"
        >
          Air {assetCounts.air}
        </button>
        <button
          aria-pressed={deviceFilter === "ground"}
          className={`${styles.deviceTab} ${deviceFilter === "ground" ? styles.deviceTabActive : ""}`}
          onClick={() => onDeviceFilterChange("ground")}
          type="button"
        >
          Ground {assetCounts.ground}
        </button>
        <button
          aria-pressed={deviceFilter === "personnel"}
          className={`${styles.deviceTab} ${deviceFilter === "personnel" ? styles.deviceTabActive : ""}`}
          onClick={() => onDeviceFilterChange("personnel")}
          type="button"
        >
          Personnel {assetCounts.personnel}
        </button>
      </div>

      <div className={styles.deviceList}>
        {filteredAssets.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <strong>No matching devices</strong>
            <p>Adjust the search or switch the asset filter to bring devices back into view.</p>
          </div>
        ) : null}
        {filteredAssets.map((asset) => (
          <button
            key={asset.id}
            className={`${styles.deviceRow} ${asset.id === selectedAssetId ? styles.deviceRowActive : ""}`}
            onClick={() => onOpenAsset(asset.id)}
            type="button"
          >
            <div className={styles.deviceRowTop}>
              <span
                className={styles.deviceDot}
                style={{ "--dot-color": statusColor(asset.status) } as CSSProperties}
              />
              <strong>{asset.callsign}</strong>
              <span className={styles.deviceType}>{asset.assetType}</span>
            </div>
            <p className={styles.deviceMeta}>{asset.name}</p>
            <p className={styles.deviceTelemetry}>
              ALT {asset.position.altM ?? 0} m &nbsp; SPD {formatSpeedKph(asset.position.speedMps)} &nbsp; HDG{" "}
              {asset.position.headingDeg ?? 0}&deg;
            </p>
          </button>
        ))}
      </div>
    </aside>
  );
}
