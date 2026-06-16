import type { Metadata } from "next";
import { HistoryWorkspace } from "@/features/history/components/history-workspace";
import { serverApiClient } from "@/lib/api-server";
import { getOperationsMapBootstrap } from "@/services/data/operations-map-bootstrap";
import { toTrack, toTrackHistoryPoint } from "@/types/domain";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Historicos",
  description: "Consulta historica de tracks por dispositivo, fecha y callsign.",
};

export default async function HistoryPage() {
  const [bootstrap, devices, tracksCurrent, trackHistory] = await Promise.all([
    getOperationsMapBootstrap(),
    serverApiClient.getDevices(),
    serverApiClient.getTracksCurrent(),
    serverApiClient.getTracksHistory(),
  ]);

  return (
    <section className={styles.stage}>
      <HistoryWorkspace
        assets={bootstrap.snapshot.assets}
        devices={devices}
        trackHistory={trackHistory.map(toTrackHistoryPoint)}
        tracksCurrent={tracksCurrent.map(toTrack)}
      />
    </section>
  );
}
