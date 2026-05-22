"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserApiClient } from "@/lib/api";
import { createRealtimeClient } from "@/lib/ws";
import { formatTime } from "@/shared/lib/format";
import { getAlertDetailHref } from "@/shared/navigation/entity-routes";
import type { Alert } from "@/types/domain";
import { toOperationalAlert } from "@/types/domain";
import styles from "./page.module.css";

export function AlertsWorkspace({
  initialAlerts,
}: Readonly<{
  initialAlerts: Alert[];
}>) {
  const [alerts, setAlerts] = useState(initialAlerts);

  useEffect(() => {
    let cancelled = false;

    async function refreshAlerts() {
      const nextAlerts = await browserApiClient.get("/alerts") as never[];

      if (!cancelled) {
        setAlerts(nextAlerts.map(toOperationalAlert));
      }
    }

    const realtime = createRealtimeClient({
      onEvent(event) {
        if (event === "alert.created" || event === "alert.updated") {
          void refreshAlerts();
        }
      },
    });

    realtime.connect();

    return () => {
      cancelled = true;
      realtime.disconnect();
    };
  }, []);

  async function acknowledgeAlert(id: string) {
    const updated = toOperationalAlert(await browserApiClient.post(`/alerts/${id}/ack`));
    setAlerts((current) => current.map((item) => item.id === id ? updated : item));
  }

  async function resolveAlert(id: string) {
    const updated = toOperationalAlert(await browserApiClient.post(`/alerts/${id}/resolve`));
    setAlerts((current) => current.map((item) => item.id === id ? updated : item));
  }

  return (
    <section className={styles.grid}>
      {alerts.map((alert) => (
        <article key={alert.id} className={styles.card}>
          <p className={styles.eyebrow}>
            {alert.severity} · {alert.status}
          </p>
          <h3>
            <Link href={getAlertDetailHref(alert.id)}>{alert.title}</Link>
          </h3>
          <p className={styles.muted}>{alert.summary}</p>
          <p className={styles.muted}>{formatTime(alert.observedAt)} UTC</p>
          <div className={styles.actions}>
            {alert.status === "open" ? (
              <button className={styles.actionButton} onClick={() => void acknowledgeAlert(alert.id)} type="button">
                ACK
              </button>
            ) : null}
            {alert.status !== "resolved" ? (
              <button className={styles.actionButton} onClick={() => void resolveAlert(alert.id)} type="button">
                Resolve
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
