import { ConsoleShell } from "@/widgets/console-shell";
import { operationalDataGateway } from "@/shared/data";
import styles from "./page.module.css";

const columns = ["open", "contained", "resolved"] as const;

export default async function IncidentsPage() {
  const incidents = await operationalDataGateway.getIncidents();

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
                  <article key={incident.id} className={styles.card}>
                    <h3>{incident.title}</h3>
                    <p className={styles.muted}>{incident.summary}</p>
                    <p className={styles.muted}>
                      {incident.owner} · {incident.assetIds.length} assets
                    </p>
                  </article>
                ))}
            </div>
          ))}
        </section>
      </div>
    </ConsoleShell>
  );
}
