"use client";

import { useState } from "react";
import {
  AssetSidebarActionStatus,
  AssetSidebarActions,
  AssetSidebarAlerts,
  AssetSidebarDeviceConfig,
  AssetSidebarIncidents,
  AssetSidebarMissionAssignments,
  AssetSidebarRecentCommands,
  AssetSidebarTelemetry,
  AssetSidebarUpdate,
  AssetSidebarVideoFeeds,
} from "./map-stage-asset-sidebar-sections";
import { useMapStageAssetSidebar, type MapStageAssetSidebarProps } from "./use-map-stage-asset-sidebar";
import styles from "../map-stage.module.css";

function AssetSidebarHeaderCallsignEditor({
  onSetTemporaryAssetCallsign,
  selectedAssetId,
  selectedAssetCallsign,
}: Readonly<{
  onSetTemporaryAssetCallsign: (assetId: string, callsign: string | null) => void;
  selectedAssetId: string;
  selectedAssetCallsign: string;
}>) {
  return (
    <AssetSidebarHeaderCallsignEditorForm
      key={`${selectedAssetId}:${selectedAssetCallsign}`}
      onSetTemporaryAssetCallsign={onSetTemporaryAssetCallsign}
      selectedAssetId={selectedAssetId}
      selectedAssetCallsign={selectedAssetCallsign}
    />
  );
}

function AssetSidebarHeaderCallsignEditorForm({
  onSetTemporaryAssetCallsign,
  selectedAssetId,
  selectedAssetCallsign,
}: Readonly<{
  onSetTemporaryAssetCallsign: (assetId: string, callsign: string | null) => void;
  selectedAssetId: string;
  selectedAssetCallsign: string;
}>) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftCallsign, setDraftCallsign] = useState(selectedAssetCallsign);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function handleSave() {
    const callsign = draftCallsign.trim();
    if (!callsign) {
      setStatusMessage("El callsign no puede quedar vacio.");
      return;
    }

    onSetTemporaryAssetCallsign(selectedAssetId, callsign);
    setStatusMessage(null);
    setDraftCallsign(callsign);
    setIsEditing(false);
  }

  return (
    <div className={styles.headerCallsignBlock}>
      <div className={styles.panelLabelRow}>
        <span className={styles.panelLabel}>{selectedAssetCallsign}</span>
        <button
          className={styles.closeButton}
          onClick={() => {
            setIsEditing((current) => !current);
            setStatusMessage(null);
            setDraftCallsign(selectedAssetCallsign);
          }}
          type="button"
        >
          {isEditing ? "Ocultar" : "Editar"}
        </button>
      </div>
      {isEditing ? (
        <div className={styles.headerEditorStack}>
          <div className={styles.inlineFormRow}>
            <input
              className={styles.inlineInput}
              onChange={(event) => {
                setDraftCallsign(event.target.value);
                setStatusMessage(null);
              }}
              placeholder="CONDOR-1"
              value={draftCallsign}
            />
            <button
              className={styles.actionButton}
              onClick={() => handleSave()}
              type="button"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : null}
      <p className={styles.headerEditorMeta}>Callsign temporal guardado solo en este navegador.</p>
      {statusMessage ? <p className={styles.headerEditorMeta}>{statusMessage}</p> : null}
    </div>
  );
}

export function MapStageAssetSidebar({
  ...props
}: MapStageAssetSidebarProps) {
  const { handleAction, viewModel } = useMapStageAssetSidebar(props);
  const {
    actionState,
    availableMissions,
    canConfigureDevices,
    canConfigureMissions,
    onRemoveMissionAssignedDevice,
    onAcknowledgeAlert,
    onClearFocus,
    onResolveAlert,
    relatedAlerts,
    relatedIncidents,
    relatedMissionAssignments,
    selectedAsset,
    selectedDevice,
    onSetTemporaryAssetCallsign,
    onUpdateDevicePlatformType,
    onUpdateMissionAssignedDevice,
  } = props;

  return (
    <aside className={styles.infoSidebar} id="asset-sidebar">
      <div className={styles.infoHeader}>
        <div>
          <AssetSidebarHeaderCallsignEditor
            onSetTemporaryAssetCallsign={onSetTemporaryAssetCallsign}
            selectedAssetId={selectedAsset.id}
            selectedAssetCallsign={selectedAsset.callsign}
          />
          <h2 className={styles.sidebarTitle}>{selectedAsset.name}</h2>
        </div>
        <div className={styles.infoActions}>
          <span className={styles.statusBadge}>{selectedAsset.status}</span>
          <button className={styles.closeButton} onClick={onClearFocus} type="button">
            Close
          </button>
        </div>
      </div>

      <AssetSidebarVideoFeeds videoFeeds={viewModel.videoFeeds} />
      <AssetSidebarTelemetry
        infoCards={viewModel.infoCards}
        heading={viewModel.heading}
        latLonRows={viewModel.latLonRows}
        metricRows={viewModel.metricRows}
        reference={viewModel.reference}
        selectedDevice={selectedDevice}
        updateBlock={viewModel.updateBlock}
      />
      <AssetSidebarDeviceConfig
        canConfigureDevices={canConfigureDevices}
        onUpdateDevicePlatformType={onUpdateDevicePlatformType}
        selectedDevice={selectedDevice}
      />
      <AssetSidebarUpdate updateBlock={viewModel.updateBlock} />
      <AssetSidebarAlerts
        onAcknowledgeAlert={onAcknowledgeAlert}
        onResolveAlert={onResolveAlert}
        relatedAlerts={relatedAlerts}
      />
      <AssetSidebarActions
        actions={viewModel.actions}
        assetId={selectedAsset.id}
        onAction={(label) => handleAction(label)}
      />
      <AssetSidebarActionStatus actionState={actionState} />
      <AssetSidebarMissionAssignments
        availableMissions={availableMissions}
        canConfigureMissions={canConfigureMissions}
        onRemoveMissionAssignedDevice={onRemoveMissionAssignedDevice}
        onUpdateMissionAssignedDevice={onUpdateMissionAssignedDevice}
        relatedMissionAssignments={relatedMissionAssignments}
        selectedDevice={selectedDevice}
      />
      <AssetSidebarIncidents relatedIncidents={relatedIncidents} />
      <AssetSidebarRecentCommands
        commandMeta={viewModel.commandMeta}
        recentCommands={viewModel.recentCommands}
        selectedDevice={selectedDevice}
      />
    </aside>
  );
}
