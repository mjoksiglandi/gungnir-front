"use client";

import Link from "next/link";
import type { Alert, Asset, Incident } from "@/shared/contracts/operational";
import { formatPercent, formatSpeedKph } from "@/shared/lib/format";
import { getAssetDetailHref, getIncidentDetailHref } from "@/shared/navigation/entity-routes";
import type { Command, Device, Mission, TelemetryRecord } from "@/types/domain";
import { CollapsiblePanel } from "./map-stage-panel-primitives";
import type { ActionState, LayerState } from "./types";
import styles from "../map-stage.module.css";

export function MapStageAssetSidebar({
  actionState,
  commands,
  connectionStatus,
  followAssetId,
  layerState,
  relatedAlerts,
  relatedIncidents,
  relatedMissions,
  selectedDevice,
  selectedAsset,
  telemetry,
  userLabel,
  onAcknowledgeAlert,
  onCenterOnAsset,
  onClearFocus,
  onQueueCommand,
  onResolveAlert,
  onToggleFollowAsset,
  onToggleLayer,
}: Readonly<{
  actionState: ActionState | null;
  commands: Command[];
  connectionStatus: string;
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
}>) {
  const latestTelemetry = telemetry[0] ?? null;

  return (
    <aside className={styles.infoSidebar} id="asset-sidebar">
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
          <span>Device</span>
          <strong>{selectedDevice?.deviceType ?? "Unlinked"}</strong>
        </div>
      </div>

      <div className={styles.infoRow}>
        <div className={styles.infoRowTop}>
          <strong>Realtime posture</strong>
          <span className={styles.alertBadge}>{connectionStatus}</span>
        </div>
        <p>{selectedDevice?.sourceType ?? "No linked backend device"} - {userLabel}</p>
      </div>

      <CollapsiblePanel meta="6 actions" title="Actions">
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
      </CollapsiblePanel>

      {actionState ? (
        <div className={`${styles.infoRow} ${actionState.tone === "warning" ? styles.infoRowWarning : ""}`}>
          <div className={styles.infoRowTop}>
            <strong>Action status</strong>
            <span className={styles.alertBadge}>{actionState.tone === "warning" ? "queued" : "sent"}</span>
          </div>
          <p>{actionState.message}</p>
        </div>
      ) : null}

      {latestTelemetry ? (
        <div className={styles.infoRow}>
          <div className={styles.infoRowTop}>
            <strong>Latest telemetry</strong>
            <span className={styles.alertBadge}>{latestTelemetry.mode ?? "live"}</span>
          </div>
          <p>
            {latestTelemetry.position.lat.toFixed(5)}, {latestTelemetry.position.lon.toFixed(5)} - BAT {formatPercent(latestTelemetry.batteryPct)}
          </p>
        </div>
      ) : null}

      {relatedMissions.length > 0 ? (
        <CollapsiblePanel meta={`${relatedMissions.length} linked`} title="Mission">
          <div className={styles.infoList}>
            {relatedMissions.map((mission) => (
              <article key={mission.id} className={styles.infoRow}>
                <div className={styles.infoRowTop}>
                  <strong>{mission.name}</strong>
                  <span className={styles.alertBadge}>{mission.status}</span>
                </div>
                <p>{mission.missionType}</p>
              </article>
            ))}
          </div>
        </CollapsiblePanel>
      ) : null}

      {relatedAlerts.length > 0 ? (
        <CollapsiblePanel meta={`${relatedAlerts.length} active`} title="Alerts">
          <div className={styles.infoList}>
            {relatedAlerts.map((alert) => (
              <article key={alert.id} className={styles.infoRow}>
                <div className={styles.infoRowTop}>
                  <strong>{alert.title}</strong>
                  <span className={styles.alertBadge}>{alert.severity}</span>
                </div>
                <p>{alert.summary}</p>
                <div className={styles.quickActions}>
                  {alert.status === "open" ? (
                    <button className={styles.actionButton} onClick={() => void onAcknowledgeAlert(alert.id)} type="button">
                      ACK
                    </button>
                  ) : null}
                  {alert.status !== "resolved" ? (
                    <button className={styles.actionButton} onClick={() => void onResolveAlert(alert.id)} type="button">
                      Resolve
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </CollapsiblePanel>
      ) : null}

      {relatedIncidents.length > 0 ? (
        <CollapsiblePanel defaultOpen={false} meta={`${relatedIncidents.length} linked`} title="Incidents">
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
        </CollapsiblePanel>
      ) : null}

      {commands.length > 0 ? (
        <CollapsiblePanel defaultOpen={false} meta={`${Math.min(commands.length, 4)} recent`} title="Recent Commands">
          <div className={styles.infoList}>
            {commands.slice(0, 4).map((command) => (
              <article key={command.id} className={styles.infoRow}>
                <div className={styles.infoRowTop}>
                  <strong>{command.type}</strong>
                  <span className={styles.alertBadge}>{command.status}</span>
                </div>
                <p>{selectedDevice?.id ?? command.deviceId ?? "device unavailable"}</p>
              </article>
            ))}
          </div>
        </CollapsiblePanel>
      ) : null}
    </aside>
  );
}
