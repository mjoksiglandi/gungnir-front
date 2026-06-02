"use client";

import Link from "next/link";
import type { Alert, Asset, Incident } from "@/shared/contracts/operational";
import { getAssetDetailHref, getIncidentDetailHref } from "@/shared/navigation/entity-routes";
import type { Command, Device, Mission, TelemetryRecord } from "@/types/domain";
import {
  getAlertDisplay,
  getQuickActions,
  getQuickHeading,
  getQuickLatLon,
  getQuickLink,
  getQuickMetrics,
  getQuickMode,
  getQuickOperator,
  getQuickReference,
  getQuickUpdate,
  getQuickVideoFeeds,
} from "./asset-quick-panel";
import { CollapsiblePanel } from "./map-stage-panel-primitives";
import type { ActionState, LayerState } from "./types";
import styles from "../map-stage.module.css";

function actionIntent(label: string) {
  const normalized = label.toLowerCase();

  if (normalized === "follow") return "follow";
  if (normalized === "show route" || normalized === "hide route") return "route";
  if (normalized === "open details") return "details";
  if (normalized === "return to base" || normalized === "stop" || normalized === "restart") return "critical";
  if (normalized === "center on map") return "center";
  return "command";
}

export function MapStageAssetSidebar({
  actionState,
  commands,
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
  const heading = getQuickHeading(selectedAsset.position.headingDeg);
  const latLonRows = getQuickLatLon(selectedAsset);
  const metricRows = getQuickMetrics(selectedAsset, latestTelemetry, selectedDevice);
  const reference = getQuickReference(selectedAsset, latestTelemetry, selectedDevice);
  const videoFeeds = getQuickVideoFeeds(selectedAsset, latestTelemetry, selectedDevice);
  const updateBlock = getQuickUpdate(selectedAsset, latestTelemetry);
  const infoCards = [
    getQuickLink(selectedAsset, latestTelemetry, selectedDevice),
    getQuickMode(latestTelemetry),
    getQuickOperator(userLabel),
  ];
  const actions = getQuickActions(selectedAsset);

  function handleAction(label: string) {
    const intent = actionIntent(label);

    if (intent === "center") {
      onCenterOnAsset(selectedAsset);
      return;
    }

    if (intent === "follow") {
      onToggleFollowAsset(selectedAsset);
      return;
    }

    if (intent === "route") {
      onToggleLayer("routes");
      return;
    }

    if (intent === "details") {
      return;
    }

    void onQueueCommand(
      selectedAsset,
      label,
      intent === "critical" ? "warning" : "default",
    );
  }

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

      {videoFeeds.length > 0 ? (
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
      ) : null}

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

      <div className={styles.infoRow}>
        <div className={styles.infoRowTop}>
          <strong>Last update</strong>
          <span className={styles.alertBadge}>{updateBlock.age}</span>
        </div>
        <p>{updateBlock.time}</p>
        <p>{updateBlock.summary}</p>
      </div>

      {relatedAlerts.length > 0 ? (
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
      ) : null}

      <CollapsiblePanel meta={`${actions.length} actions`} title="Actions">
        <div className={styles.quickActions}>
          {actions.map((action) => {
            const intent = actionIntent(action.label);
            const isDetails = intent === "details";
            const className = `${styles.actionButton} ${action.tone === "warning" ? styles.actionButtonWarning : ""} ${
              action.label === "FOLLOW" && followAssetId === selectedAsset.id ? styles.actionButtonPrimary : ""
            } ${intent === "route" && layerState.routes ? styles.actionButtonPrimary : ""}`;

            if (isDetails) {
              return (
                <Link key={action.label} className={className} href={getAssetDetailHref(selectedAsset.id)}>
                  {action.label}
                </Link>
              );
            }

            return (
              <button key={action.label} className={className} onClick={() => handleAction(action.label)} type="button">
                {action.label === "FOLLOW" && followAssetId === selectedAsset.id ? "FOLLOWING" : action.label}
              </button>
            );
          })}
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

      {relatedMissions.length > 0 ? (
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
