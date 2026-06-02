"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { Asset } from "@/shared/contracts/operational";
import { getDeviceVisual } from "./device-visuals";
import { statusColor } from "./helpers";
import type { DeviceFilter } from "./types";
import styles from "../map-stage.module.css";

type AssetCounts = Record<"air" | "ground" | "personnel" | "maritime", number>;

const deviceFilters: Array<{ key: DeviceFilter; label: string; meta: (counts: AssetCounts, total: number) => string }> = [
  { key: "all", label: "All", meta: (_, total) => `${total}` },
  { key: "air", label: "A", meta: (counts) => `${counts.air}` },
  { key: "ground", label: "G", meta: (counts) => `${counts.ground}` },
  { key: "personnel", label: "P", meta: (counts) => `${counts.personnel}` },
  { key: "maritime", label: "M", meta: (counts) => `${counts.maritime}` },
];

function filterTitle(filter: DeviceFilter) {
  if (filter === "air") return "Air";
  if (filter === "ground") return "Ground";
  if (filter === "personnel") return "Personnel";
  if (filter === "maritime") return "Maritime";
  return "All";
}

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

      <div className={`${styles.layerRailShell} ${styles.deviceRailShell}`}>
        <nav aria-label="Device filters" className={styles.layerRail}>
          {deviceFilters.map((filter) => (
            <button
              key={filter.key}
              aria-pressed={deviceFilter === filter.key}
              className={`${styles.layerRailItem} ${styles.layerRailItemInfo} ${deviceFilter === filter.key ? styles.layerRailItemActive : ""}`}
              onClick={() => onDeviceFilterChange(filter.key)}
              type="button"
            >
              <span className={styles.layerRailMarker} />
              <span className={styles.layerRailLabel}>{filter.label}</span>
              <span className={styles.layerRailMeta}>{filter.meta(assetCounts, assetsTotal)}</span>
            </button>
          ))}
        </nav>

        <div className={styles.layerDetailPanel}>
          <div className={styles.layerDetailGroup}>
            <div className={styles.detailHeading}>
              <span className={styles.detailEyebrow}>Operational assets</span>
              <strong className={styles.detailTitle}>{filterTitle(deviceFilter)}</strong>
            </div>

            <div className={styles.deviceList}>
              {filteredAssets.length === 0 ? (
                <div className={styles.emptyStateCard}>
                  <strong>No matching devices</strong>
                  <p>Adjust the search or switch the asset filter to bring devices back into view.</p>
                </div>
              ) : null}
              {filteredAssets.map((asset) => {
                const visual = getDeviceVisual(asset);

                return (
                  <button
                    key={asset.id}
                    className={`${styles.deviceRow} ${asset.id === selectedAssetId ? styles.deviceRowActive : ""}`}
                    onClick={() => onOpenAsset(asset.id)}
                    type="button"
                  >
                    <div className={styles.deviceRowIconCell}>
                      <span
                        className={styles.deviceDot}
                        style={{ "--dot-color": statusColor(asset.status) } as CSSProperties}
                      />
                      <div className={styles.deviceIconFrame}>
                        <Image
                          alt={visual.label}
                          className={styles.deviceIcon}
                          height={34}
                          src={visual.iconPath}
                          width={34}
                        />
                      </div>
                    </div>

                    <div className={styles.deviceRowContent}>
                      <div className={styles.deviceRowTop}>
                        <div className={styles.deviceHeading}>
                          <strong>{asset.callsign}</strong>
                          <span className={styles.deviceMeta}>{asset.name}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
