"use client";

import {
  AssetSidebarActionStatus,
  AssetSidebarActions,
  AssetSidebarAlerts,
  AssetSidebarIncidents,
  AssetSidebarMissions,
  AssetSidebarRecentCommands,
  AssetSidebarTelemetry,
  AssetSidebarUpdate,
  AssetSidebarVideoFeeds,
} from "./map-stage-asset-sidebar-sections";
import { useMapStageAssetSidebar, type MapStageAssetSidebarProps } from "./use-map-stage-asset-sidebar";
import styles from "../map-stage.module.css";

export function MapStageAssetSidebar({
  ...props
}: MapStageAssetSidebarProps) {
  const { handleAction, viewModel } = useMapStageAssetSidebar(props);
  const {
    actionState,
    onAcknowledgeAlert,
    onClearFocus,
    onResolveAlert,
    relatedAlerts,
    relatedIncidents,
    relatedMissions,
    selectedAsset,
    selectedDevice,
  } = props;

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
      <AssetSidebarMissions relatedMissions={relatedMissions} />
      <AssetSidebarIncidents relatedIncidents={relatedIncidents} />
      <AssetSidebarRecentCommands
        commandMeta={viewModel.commandMeta}
        recentCommands={viewModel.recentCommands}
        selectedDevice={selectedDevice}
      />
    </aside>
  );
}
