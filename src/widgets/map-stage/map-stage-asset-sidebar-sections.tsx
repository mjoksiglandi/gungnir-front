"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Alert, Incident } from "@/shared/contracts/operational";
import { getAssetDetailHref, getIncidentDetailHref } from "@/shared/navigation/entity-routes";
import type {
  Command,
  Device,
  DevicePlatformType,
  Mission,
  MissionAssignedDevice,
  MissionDeviceAssignment,
} from "@/types/domain";
import { getAlertDisplay } from "./asset-quick-panel";
import {
  getActionStatusToneLabel,
  type AssetActionIntent,
} from "./map-stage-asset-sidebar.helpers";
import { CollapsiblePanel } from "./map-stage-panel-primitives";
import type { ActionState } from "./types";
import styles from "../map-stage.module.css";

type AssetSidebarViewModel = ReturnType<typeof import("./map-stage-asset-sidebar.helpers").buildAssetSidebarViewModel>;
const PLATFORM_TYPE_OPTIONS: DevicePlatformType[] = ["air", "sea", "land", "manpack", "vehicle", "unknown"];

function getDevicePlatformType(device: Device | null): DevicePlatformType {
  return device?.platformType ?? device?.P ?? "unknown";
}

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

export function AssetSidebarDeviceConfig({
  canConfigureDevices,
  onUpdateDevicePlatformType,
  selectedDevice,
}: Readonly<{
  canConfigureDevices: boolean;
  onUpdateDevicePlatformType: (device: Device, platformType: DevicePlatformType) => Promise<Device>;
  selectedDevice: Device | null;
}>) {
  const currentPlatformType = getDevicePlatformType(selectedDevice);

  return (
    <CollapsiblePanel
      defaultOpen={false}
      meta={selectedDevice ? currentPlatformType : "No device"}
      title="Device Config"
    >
      {!selectedDevice ? (
        <article className={styles.infoRow}>
          <div className={styles.infoRowTop}>
            <strong>Device unavailable</strong>
            <span className={styles.alertBadge}>read only</span>
          </div>
          <p>The selected asset does not currently have a linked device record.</p>
        </article>
      ) : (
        <div className={styles.infoList}>
          <AssetSidebarDeviceConfigEditor
            key={`${selectedDevice.id}-${currentPlatformType}`}
            canConfigureDevices={canConfigureDevices}
            currentPlatformType={currentPlatformType}
            onUpdateDevicePlatformType={onUpdateDevicePlatformType}
            selectedDevice={selectedDevice}
          />
        </div>
      )}
    </CollapsiblePanel>
  );
}

function AssetSidebarDeviceConfigEditor({
  canConfigureDevices,
  currentPlatformType,
  onUpdateDevicePlatformType,
  selectedDevice,
}: Readonly<{
  canConfigureDevices: boolean;
  currentPlatformType: DevicePlatformType;
  onUpdateDevicePlatformType: (device: Device, platformType: DevicePlatformType) => Promise<Device>;
  selectedDevice: Device;
}>) {
  const [draftPlatformType, setDraftPlatformType] = useState<DevicePlatformType>(currentPlatformType);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleSave() {
    if (draftPlatformType === currentPlatformType) {
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await onUpdateDevicePlatformType(selectedDevice, draftPlatformType);
      setStatusMessage("Platform type updated.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not update platform type.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className={styles.infoRow}>
      <div className={styles.infoRowTop}>
        <strong>Platform type</strong>
        <span className={styles.alertBadge}>{currentPlatformType}</span>
      </div>
      <p>{selectedDevice.deviceType} | {selectedDevice.sourceType}</p>
      {canConfigureDevices ? (
        <div className={styles.inlineFormRow}>
          <select
            className={styles.inlineSelect}
            disabled={isSaving}
            onChange={(event) => {
              setDraftPlatformType(event.target.value as DevicePlatformType);
              setStatusMessage(null);
            }}
            value={draftPlatformType}
          >
            {PLATFORM_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            className={styles.actionButton}
            disabled={isSaving || draftPlatformType === currentPlatformType}
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving ? "Saving" : "Save"}
          </button>
        </div>
      ) : null}
      {!canConfigureDevices ? <p>Editing requires `devices.configure`.</p> : null}
      {statusMessage ? <p>{statusMessage}</p> : null}
    </article>
  );
}

type MissionDraftState = {
  callsign: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
};

export function AssetSidebarMissionAssignments({
  availableMissions,
  canConfigureMissions,
  onRemoveMissionAssignedDevice,
  onUpdateMissionAssignedDevice,
  relatedMissionAssignments,
  selectedDevice,
}: Readonly<{
  availableMissions: Mission[];
  canConfigureMissions: boolean;
  onRemoveMissionAssignedDevice: (mission: Mission, deviceId: string) => Promise<Mission>;
  onUpdateMissionAssignedDevice: (mission: Mission, input: MissionAssignedDevice) => Promise<Mission>;
  relatedMissionAssignments: MissionDeviceAssignment[];
  selectedDevice: Device | null;
}>) {
  const assignmentsByMissionId = useMemo(() => new Map(
    relatedMissionAssignments.map((item) => [item.mission.id, item.assignment]),
  ), [relatedMissionAssignments]);
  const missionsToRender = useMemo(() => {
    if (canConfigureMissions) {
      return availableMissions;
    }

    return relatedMissionAssignments.map((item) => item.mission);
  }, [availableMissions, canConfigureMissions, relatedMissionAssignments]);
  const [drafts, setDrafts] = useState<Record<string, MissionDraftState>>({});
  const [savingMissionId, setSavingMissionId] = useState<string | null>(null);
  const [statusByMissionId, setStatusByMissionId] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextDrafts: Record<string, MissionDraftState> = {};

    for (const mission of availableMissions) {
      const assignment = assignmentsByMissionId.get(mission.id);
      nextDrafts[mission.id] = {
        callsign: assignment?.callsign ?? "",
        enabled: Boolean(assignment),
        metadata: assignment?.metadata ?? {},
      };
    }

    setDrafts(nextDrafts);
    setStatusByMissionId({});
  }, [assignmentsByMissionId, availableMissions, selectedDevice?.id]);

  function updateDraft(missionId: string, value: Partial<MissionDraftState>) {
    setDrafts((current) => ({
      ...current,
      [missionId]: {
        ...(current[missionId] ?? { callsign: "", enabled: false, metadata: {} }),
        ...value,
      },
    }));
  }

  async function handleSave(mission: Mission) {
    if (!selectedDevice) {
      return;
    }

    const draft = drafts[mission.id] ?? { callsign: "", enabled: false, metadata: {} };
    const callsign = draft.callsign.trim();

    if (!draft.enabled) {
      setStatusByMissionId((current) => ({
        ...current,
        [mission.id]: "Enable the assignment before saving.",
      }));
      return;
    }

    if (!callsign) {
      setStatusByMissionId((current) => ({
        ...current,
        [mission.id]: "Callsign is required for an assigned device.",
      }));
      return;
    }

    setSavingMissionId(mission.id);
    setStatusByMissionId((current) => ({
      ...current,
      [mission.id]: "",
    }));

    try {
      await onUpdateMissionAssignedDevice(mission, {
        deviceId: selectedDevice.id,
        callsign,
        metadata: draft.metadata,
      });
      setStatusByMissionId((current) => ({
        ...current,
        [mission.id]: "Mission assignment updated.",
      }));
    } catch (error) {
      setStatusByMissionId((current) => ({
        ...current,
        [mission.id]: error instanceof Error ? error.message : "Could not update mission assignment.",
      }));
    } finally {
      setSavingMissionId(null);
    }
  }

  async function handleRemove(mission: Mission) {
    if (!selectedDevice) {
      return;
    }

    setSavingMissionId(mission.id);
    setStatusByMissionId((current) => ({
      ...current,
      [mission.id]: "",
    }));

    try {
      await onRemoveMissionAssignedDevice(mission, selectedDevice.id);
      updateDraft(mission.id, {
        callsign: "",
        enabled: false,
        metadata: {},
      });
      setStatusByMissionId((current) => ({
        ...current,
        [mission.id]: "Mission assignment removed.",
      }));
    } catch (error) {
      setStatusByMissionId((current) => ({
        ...current,
        [mission.id]: error instanceof Error ? error.message : "Could not remove mission assignment.",
      }));
    } finally {
      setSavingMissionId(null);
    }
  }

  if (!selectedDevice) {
    return (
      <CollapsiblePanel defaultOpen={false} meta="No device" title="Mission Assignments">
        <article className={styles.infoRow}>
          <div className={styles.infoRowTop}>
            <strong>Mission-device relation unavailable</strong>
            <span className={styles.alertBadge}>read only</span>
          </div>
          <p>The selected asset needs a linked device before it can be assigned a mission callsign.</p>
        </article>
      </CollapsiblePanel>
    );
  }

  return (
    <CollapsiblePanel
      defaultOpen={false}
      meta={`${relatedMissionAssignments.length} linked`}
      title="Mission Assignments"
    >
      <div className={styles.infoList}>
        {missionsToRender.length === 0 ? (
          <article className={styles.infoRow}>
            <div className={styles.infoRowTop}>
              <strong>No missions available</strong>
              <span className={styles.alertBadge}>empty</span>
            </div>
            <p>{canConfigureMissions ? "Create a mission in the backend first." : "This device is not assigned to any mission."}</p>
          </article>
        ) : null}
        {missionsToRender.map((mission) => {
          const assignment = assignmentsByMissionId.get(mission.id) ?? null;
          const draft = drafts[mission.id] ?? {
            callsign: assignment?.callsign ?? "",
            enabled: Boolean(assignment),
            metadata: assignment?.metadata ?? {},
          };
          const isSaving = savingMissionId === mission.id;

          return (
            <article key={mission.id} className={styles.infoRow}>
              <div className={styles.infoRowTop}>
                <strong>{mission.name}</strong>
                <span className={styles.alertBadge}>{mission.status}</span>
              </div>
              <p>{mission.missionType}</p>
              <p>
                Callsign: <strong>{assignment?.callsign ?? "Not assigned"}</strong>
              </p>
              {canConfigureMissions ? (
                <>
                  {!draft.enabled ? (
                    <div className={styles.quickActions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => {
                          updateDraft(mission.id, {
                            enabled: true,
                            callsign: assignment?.callsign ?? "",
                            metadata: assignment?.metadata ?? {},
                          });
                          setStatusByMissionId((current) => ({ ...current, [mission.id]: "" }));
                        }}
                        type="button"
                      >
                        Assign
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.inlineFormStack}>
                        <label className={styles.inlineLabel} htmlFor={`callsign-${mission.id}`}>
                          Mission callsign
                        </label>
                        <input
                          className={styles.inlineInput}
                          disabled={isSaving}
                          id={`callsign-${mission.id}`}
                          onChange={(event) => {
                            updateDraft(mission.id, { callsign: event.target.value });
                            setStatusByMissionId((current) => ({ ...current, [mission.id]: "" }));
                          }}
                          placeholder="CONDOR-1"
                          value={draft.callsign}
                        />
                      </div>
                      <div className={styles.quickActions}>
                        <button
                          className={styles.actionButton}
                          disabled={isSaving}
                          onClick={() => void handleSave(mission)}
                          type="button"
                        >
                          {isSaving ? "Saving" : "Save"}
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.actionButtonWarning}`}
                          disabled={isSaving}
                          onClick={() => void handleRemove(mission)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                  {!statusByMissionId[mission.id] ? null : <p>{statusByMissionId[mission.id]}</p>}
                </>
              ) : (
                <p>Editing requires `missions.configure`.</p>
              )}
            </article>
          );
        })}
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
