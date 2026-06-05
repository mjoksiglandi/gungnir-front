"use client";

import Link from "next/link";
import type { Alert, Incident } from "@/shared/contracts/operational";
import { getAssetDetailHref, getIncidentDetailHref } from "@/shared/navigation/entity-routes";
import type { Command, Device, Mission } from "@/types/domain";
import { getAlertDisplay } from "./asset-quick-panel";
import {
  getActionStatusToneLabel,
  type AssetActionIntent,
} from "./map-stage-asset-sidebar.helpers";
import { CollapsiblePanel } from "./map-stage-panel-primitives";
import type { ActionState } from "./types";
import styles from "../map-stage.module.css";

type AssetSidebarViewModel = ReturnType<typeof import("./map-stage-asset-sidebar.helpers").buildAssetSidebarViewModel>;

export function AssetSidebarVideoFeeds({ videoFeeds }: Readonly<{ videoFeeds: AssetSidebarViewModel["videoFeeds"] }>) {
  if (videoFeeds.length === 0) {
    return null;
  }

  return (
    <section className={styles.detailSection}>
      <div className={styles.detailSectionHeader}>
        <div>
          <span className={styles.detailSectionEyebrow}>Video feeds</span>
          <strong className={styles.detailSectionTitle}>RTSP dock</strong>
        </div>
      </div>

      <div className={styles.rtspDock}>
        {videoFeeds.map((feed) => (
          <article key={feed.label} className={styles.rtspSlot}>
            <div className={styles.rtspSlotTop}>
              <strong>{feed.label}</strong>
              <span>{feed.state}</span>
            </div>
            <p>RTSP preview placeholder ready for stream attachment.</p>
            <code className={styles.rtspHint}>{feed.url}</code>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AssetSidebarTelemetry({
  infoCards,
  heading,
  latLonRows,
  metricRows,
  reference,
  selectedDevice,
  updateBlock,
}: Readonly<{
  infoCards: AssetSidebarViewModel["infoCards"];
  heading: AssetSidebarViewModel["heading"];
  latLonRows: AssetSidebarViewModel["latLonRows"];
  metricRows: AssetSidebarViewModel["metricRows"];
  reference: AssetSidebarViewModel["reference"];
  selectedDevice: Device | null;
  updateBlock: AssetSidebarViewModel["updateBlock"];
}>) {
  return (
    <section className={styles.detailSection}>
      <div className={styles.detailSectionHeader}>
        <div>
          <span className={styles.detailSectionEyebrow}>Navigation + telemetry</span>
          <strong className={styles.detailSectionTitle}>Realtime snapshot</strong>
        </div>
        <div className={styles.snapshotHeaderMeta}>
          <span className={styles.snapshotHeaderMetaLabel}>Last seen</span>
          <strong>{selectedDevice?.lastSeenAt ? updateBlock.time : "UNKNOWN"}</strong>
        </div>
      </div>

      <div className={styles.telemetryOverview}>
        <div className={styles.headingColumn}>
          <div className={styles.headingRing}>
            <span className={styles.headingCardEyebrow}>Heading</span>
            <strong>{heading.value}&deg;</strong>
            <p>{heading.label}</p>
            <span className={styles.headingCardDirection}>{heading.direction}</span>
          </div>

          <div className={styles.positionStrip}>
            {latLonRows.map((row) => (
              <article key={row.label} className={styles.positionStripCard}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.telemetrySummaryGrid}>
          {metricRows.map((row) => (
            <article key={row.label} className={styles.telemetrySummaryCard}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
              {row.secondary ? <em>{row.secondary}</em> : null}
            </article>
          ))}

          {reference ? (
            <article className={`${styles.telemetrySummaryCard} ${styles.referenceCard}`}>
              <span>{reference.heading}</span>
              <strong>{reference.label}</strong>
              <em>{reference.direction}</em>
            </article>
          ) : null}
        </div>
      </div>

      <div className={styles.detailDataGrid}>
        {infoCards.map((row) => (
          <article key={row.label} className={`${styles.detailDataCard} ${row.label === "LINK" ? styles.linkCard : ""}`}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            {row.secondary ? <em>{row.secondary}</em> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function AssetSidebarUpdate({ updateBlock }: Readonly<{ updateBlock: AssetSidebarViewModel["updateBlock"] }>) {
  return (
    <div className={styles.infoRow}>
      <div className={styles.infoRowTop}>
        <strong>Last update</strong>
        <span className={styles.alertBadge}>{updateBlock.age}</span>
      </div>
      <p>{updateBlock.time}</p>
      <p>{updateBlock.summary}</p>
    </div>
  );
}

export function AssetSidebarAlerts({
  relatedAlerts,
  onAcknowledgeAlert,
  onResolveAlert,
}: Readonly<{
  relatedAlerts: Alert[];
  onAcknowledgeAlert: (id: string) => Promise<Alert>;
  onResolveAlert: (id: string) => Promise<Alert>;
}>) {
  if (relatedAlerts.length === 0) {
    return null;
  }

  return (
    <section className={styles.detailSection}>
      <div className={styles.detailSectionHeader}>
        <div>
          <span className={styles.detailSectionEyebrow}>Alerts</span>
          <strong className={styles.detailSectionTitle}>Active signals</strong>
        </div>
      </div>

      <div className={styles.infoList}>
        {relatedAlerts.slice(0, 2).map((alert) => {
          const display = getAlertDisplay(alert);

          return (
            <article key={alert.id} className={styles.infoRow}>
              <div className={styles.infoRowTop}>
                <strong>{display.title}</strong>
                <span className={styles.alertBadge}>{display.severity}</span>
              </div>
              <p>{display.timeAgo}</p>
              <div className={styles.quickActions}>
                {alert.status === "open" ? (
                  <button className={styles.actionButton} onClick={() => void onAcknowledgeAlert(alert.id)} type="button">
                    Ack
                  </button>
                ) : null}
                {alert.status !== "resolved" ? (
                  <button className={styles.actionButton} onClick={() => void onResolveAlert(alert.id)} type="button">
                    Resolve
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function AssetSidebarActions({
  actions,
  assetId,
  onAction,
}: Readonly<{
  actions: AssetSidebarViewModel["actions"];
  assetId: string;
  onAction: (label: string, intent: AssetActionIntent) => void;
}>) {
  return (
    <CollapsiblePanel meta={`${actions.length} actions`} title="Actions">
      <div className={styles.quickActions}>
        {actions.map((action) => {
          const isDetails = action.intent === "details";
          const className = `${styles.actionButton} ${action.tone === "warning" ? styles.actionButtonWarning : ""} ${
            action.isFollowActive || action.isRouteActive ? styles.actionButtonPrimary : ""
          }`;

          if (isDetails) {
            return (
              <Link key={action.label} className={className} href={getAssetDetailHref(assetId)}>
                {action.label}
              </Link>
            );
          }

          return (
            <button key={action.label} className={className} onClick={() => onAction(action.label, action.intent)} type="button">
              {action.isFollowActive ? "FOLLOWING" : action.label}
            </button>
          );
        })}
      </div>
    </CollapsiblePanel>
  );
}

export function AssetSidebarActionStatus({ actionState }: Readonly<{ actionState: ActionState | null }>) {
  if (!actionState) {
    return null;
  }

  return (
    <div className={`${styles.infoRow} ${actionState.tone === "warning" ? styles.infoRowWarning : ""}`}>
      <div className={styles.infoRowTop}>
        <strong>Action status</strong>
        <span className={styles.alertBadge}>{getActionStatusToneLabel(actionState)}</span>
      </div>
      <p>{actionState.message}</p>
    </div>
  );
}

export function AssetSidebarMissions({ relatedMissions }: Readonly<{ relatedMissions: Mission[] }>) {
  if (relatedMissions.length === 0) {
    return null;
  }

  return (
    <CollapsiblePanel defaultOpen={false} meta={`${relatedMissions.length} linked`} title="Mission">
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
  );
}

export function AssetSidebarIncidents({ relatedIncidents }: Readonly<{ relatedIncidents: Incident[] }>) {
  if (relatedIncidents.length === 0) {
    return null;
  }

  return (
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
  );
}

export function AssetSidebarRecentCommands({
  recentCommands,
  commandMeta,
  selectedDevice,
}: Readonly<{
  recentCommands: Command[];
  commandMeta: string;
  selectedDevice: Device | null;
}>) {
  if (recentCommands.length === 0) {
    return null;
  }

  return (
    <CollapsiblePanel defaultOpen={false} meta={commandMeta} title="Recent Commands">
      <div className={styles.infoList}>
        {recentCommands.map((command) => (
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
  );
}
