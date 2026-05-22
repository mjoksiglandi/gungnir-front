import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth";
import { serverApiClient } from "@/lib/api-server";
import { operationalDataGateway } from "@/shared/data";
import { getIncidentDetailHref } from "@/shared/navigation/entity-routes";
import { ConsoleShell } from "@/widgets/console-shell";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Incidents",
  description: "Coordination board for active incidents, ownership, and operational progression.",
};

const columns = ["open", "contained", "resolved"] as const;

export default async function IncidentsPage() {
  await requireAuthenticatedUser();
  const [incidents, missions] = await Promise.all([
    operationalDataGateway.getIncidents(),
    serverApiClient.getMissions(),
  ]);

  return (
    <ConsoleShell activePath="/incidents">
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Incident board</p>
          <h2>Coordination flow can mature here after the map-first shell is validated.</h2>
          <p className={styles.muted}>
            Keeping incidents separate from alerts now makes it easier to add operator ownership and workflow later.
          </p>
        </section>
        <section className={styles.board}>
          {columns.map((column) => (
            <div key={column} className={styles.column}>
              <p className={styles.eyebrow}>{column}</p>
              {incidents
                .filter((incident) => incident.status === column)
                .map((incident) => (
                  <Link key={incident.id} href={getIncidentDetailHref(incident.id)} className={styles.card}>
                    <h3>{incident.title}</h3>
                    <p className={styles.muted}>{incident.summary}</p>
                    <p className={styles.muted}>
                      {incident.owner} · {incident.assetIds.length} assets
                    </p>
                  </Link>
                ))}
            </div>
          ))}
        </section>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Mission status</p>
          <h2>Mission records from the backend are now visible alongside the current coordination workflow.</h2>
          <div className={styles.missionGrid}>
            {missions.map((mission) => (
              <article key={mission.id} className={styles.card}>
                <h3>{mission.name}</h3>
                <p className={styles.muted}>{mission.missionType}</p>
                <p className={styles.muted}>
                  {mission.status} · {mission.assignedUnits.length} assigned units
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </ConsoleShell>
  );
}
