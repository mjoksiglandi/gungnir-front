import { ConsoleShell } from "@/widgets/console-shell";
import { scenario } from "@/shared/mock/scenario";
import { formatTime } from "@/shared/lib/format";
import styles from "./page.module.css";

export default function AlertsPage() {
  return (
    <ConsoleShell activePath="/alerts">
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Alert workspace</p>
          <h2>Operator-facing alert feed</h2>
          <p className={styles.muted}>
            This page is already wired to the same typed mock contract the operations view consumes.
          </p>
        </section>
        <section className={styles.grid}>
          {scenario.alerts.map((alert) => (
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
