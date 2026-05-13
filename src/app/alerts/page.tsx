import { ConsoleShell } from "@/widgets/console-shell";
import { operationalDataGateway } from "@/shared/data";
import { formatTime } from "@/shared/lib/format";
import styles from "./page.module.css";

export default async function AlertsPage() {
  const alerts = await operationalDataGateway.getAlerts();

  return (
    <ConsoleShell activePath="/alerts">
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Alert workspace</p>
          <h2>Operator-facing alert feed</h2>
          <p className={styles.muted}>
            This page now reads through the same typed access gateway the operations view consumes.
          </p>
        </section>
        <section className={styles.grid}>
          {alerts.map((alert) => (
            <article key={alert.id} className={styles.card}>
              <p className={styles.eyebrow}>
                {alert.severity} · {alert.status}
              </p>
              <h3>{alert.title}</h3>
              <p className={styles.muted}>{alert.summary}</p>
              <p className={styles.muted}>{formatTime(alert.observedAt)} UTC</p>
            </article>
          ))}
        </section>
      </div>
    </ConsoleShell>
  );
}
