import type { Metadata } from "next";
import { AlertsWorkspace } from "@/features/alerts/components/alerts-workspace";
import { operationalDataGateway } from "@/services/data";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Alerts",
  description: "Operator-facing alert feed for monitoring severity, status, and linked field activity.",
};

export default async function AlertsPage() {
  const alerts = await operationalDataGateway.getAlerts();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Alert workspace</p>
        <h2>Operator-facing alert feed</h2>
        <p className={styles.muted}>
          Active alerts stay aligned with backend status changes, and operators can acknowledge or resolve them in place.
        </p>
      </section>
      <AlertsWorkspace initialAlerts={alerts} />
    </div>
  );
}
