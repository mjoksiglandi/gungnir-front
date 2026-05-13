"use client";

import Link from "next/link";
import type { Asset, Incident } from "@/shared/contracts/operational";
import { formatPercent, formatSpeedKph } from "@/shared/lib/format";
import { getAssetDetailHref, getIncidentDetailHref } from "@/shared/navigation/entity-routes";
import type { ActionState, LayerState } from "./types";
import styles from "../map-stage.module.css";

export function MapStageAssetSidebar({
  actionState,
  followAssetId,
  layerState,
  relatedIncidents,
  selectedAsset,
  onCenterOnAsset,
  onClearFocus,
  onQueueCommand,
  onToggleFollowAsset,
  onToggleLayer,
}: Readonly<{
  actionState: ActionState | null;
  followAssetId: string | null;
  layerState: LayerState;
  relatedIncidents: Incident[];
  selectedAsset: Asset;
  onCenterOnAsset: (asset: Asset) => void;
  onClearFocus: () => void;
  onQueueCommand: (asset: Asset, commandLabel: string, tone?: ActionState["tone"]) => void;
  onToggleFollowAsset: (asset: Asset) => void;
  onToggleLayer: (key: keyof LayerState) => void;
}>) {
  return (
    <aside className={styles.infoSidebar}>
      <div className={styles.infoHeader}>
        <div>
          <span className={styles.panelLabel}>{selectedAsset.callsign}</span>
          <h2 className={styles.sidebarTitle}>{selectedAsset.name}</h2>
        </div>
        <div className={styles.infoActions}>
          <span className={styles.statusBadge}>{selectedAsset.status}</span>
          <button className={styles.closeButton} onClick={onClearFocus} type="button">
            Close
          </button>
        </div>
      </div>

      <div className={styles.heroPanel}>
        <div className={styles.heroSketch} />
        <div className={styles.heroMetrics}>
          <div>
            <span>Battery</span>
            <strong>{formatPercent(selectedAsset.batteryPct)}</strong>
          </div>
          <div>
            <span>Link</span>
            <strong>{formatPercent(selectedAsset.linkQualityPct)}</strong>
          </div>
        </div>
      </div>

      <div className={styles.instrumentGrid}>
        <div className={styles.instrumentCard}>
          <span>Altitude</span>
          <strong>{selectedAsset.position.altM ?? 0} m</strong>
        </div>
        <div className={styles.instrumentCard}>
          <span>Ground speed</span>
          <strong>{formatSpeedKph(selectedAsset.position.speedMps)}</strong>
        </div>
        <div className={styles.instrumentCard}>
          <span>Heading</span>
          <strong>{selectedAsset.position.headingDeg ?? 0}&deg;</strong>
        </div>
        <div className={styles.instrumentCard}>
          <span>Mission</span>
          <strong>{selectedAsset.mission}</strong>
        </div>
      </div>

      <div className={styles.quickActions}>
        <button className={styles.actionButton} onClick={() => onCenterOnAsset(selectedAsset)} type="button">
          Center on map
        </button>
        <button
          className={`${styles.actionButton} ${followAssetId === selectedAsset.id ? styles.actionButtonPrimary : ""}`}
          onClick={() => onToggleFollowAsset(selectedAsset)}
          type="button"
        >
          {followAssetId === selectedAsset.id ? "Following" : "Follow"}
        </button>
        <button
          className={`${styles.actionButton} ${layerState.routes ? styles.actionButtonPrimary : ""}`}
          onClick={() => onToggleLayer("routes")}
          type="button"
        >
          {layerState.routes ? "Hide route" : "Show route"}
        </button>
        <button className={styles.actionButton} onClick={() => onQueueCommand(selectedAsset, "Command uplink")} type="button">
          Send command
        </button>
        <button
          className={`${styles.actionButton} ${styles.actionButtonWarning}`}
          onClick={() => onQueueCommand(selectedAsset, "Return-to-base", "warning")}
          type="button"
        >
          Return to base
        </button>
        <Link className={styles.actionButton} href={getAssetDetailHref(selectedAsset.id)}>
          Open details
        </Link>
      </div>

      {actionState ? (
        <div className={`${styles.infoRow} ${actionState.tone === "warning" ? styles.infoRowWarning : ""}`}>
          <div className={styles.infoRowTop}>
            <strong>Action status</strong>
            <span className={styles.alertBadge}>{actionState.tone === "warning" ? "queued" : "sent"}</span>
          </div>
          <p>{actionState.message}</p>
        </div>
      ) : null}

      <div className={styles.infoList}>
        {relatedIncidents.map((incident) => (
          <article key={incident.id} className={styles.infoRow}>
            <div className={styles.infoRowTop}>
              <strong>
                <Link href={getIncidentDetailHref(incident.id)}>{incident.title}</Link>
              </strong>
              <span className={styles.alertBadge}>{incident.status}</span>
            </div>
            <p>{incident.summary}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
