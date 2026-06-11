import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth";
import { serverApiClient } from "@/lib/api-server";
import { ConsoleShell } from "@/widgets/console-shell";
import { toTrack, toTrackHistoryPoint } from "@/types/domain";
import { getOperationsMapBootstrap } from "@/shared/data/operations-map-bootstrap";
import { HistoryWorkspace } from "./history-workspace";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Históricos",
  description: "Consulta histórica de tracks por dispositivo, fecha y callsign.",
};

export default async function HistoryPage() {
  await requireAuthenticatedUser();

  const [bootstrap, devices, tracksCurrent, trackHistory] = await Promise.all([
    getOperationsMapBootstrap(),
    serverApiClient.getDevices(),
    serverApiClient.getTracksCurrent(),
    serverApiClient.getTracksHistory(),
  ]);

  return (
    <ConsoleShell activePath="/historicos">
      <section className={styles.stage}>
        <HistoryWorkspace
          assets={bootstrap.snapshot.assets}
          devices={devices}
          trackHistory={trackHistory.map(toTrackHistoryPoint)}
          tracksCurrent={tracksCurrent.map(toTrack)}
        />
      </section>
    </ConsoleShell>
  );
}
