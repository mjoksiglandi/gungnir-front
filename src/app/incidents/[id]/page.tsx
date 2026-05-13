import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/entity-detail.module.css";
import { operationalDataGateway } from "@/shared/data";
import {
  buildOperationsHref,
  getAlertDetailHref,
  getAssetDetailHref,
} from "@/shared/navigation/entity-routes";
import { ConsoleShell } from "@/widgets/console-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const incident = await operationalDataGateway.getEntity("incident", id);

  if (!incident) {
    return {
      title: "Incident not found",
    };
  }

  return {
    title: `${incident.title} | Incident`,
    description: incident.summary,
  };
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const incident = await operationalDataGateway.getEntity("incident", id);

  if (!incident) {
    notFound();
  }

  const [assets, alerts] = await Promise.all([
    operationalDataGateway.getAssets(),
    operationalDataGateway.getAlerts(),
  ]);

  const relatedAssets = assets.filter((asset) => incident.assetIds.includes(asset.id));
  const relatedAlerts = alerts.filter((alert) => incident.alertIds.includes(alert.id));

  return (
    <ConsoleShell activePath={`/incidents/${incident.id}`}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Incident detail</p>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{incident.title}</h2>
            <span className={styles.status}>{incident.status}</span>
          </div>
          <p className={styles.muted}>{incident.summary}</p>
          <div className={styles.actions}>
            <Link className={styles.actionLink} href={buildOperationsHref({ incidentId: incident.id })}>
              Open in operations
            </Link>
            <Link className={styles.actionLink} href="/incidents">
              Back to incidents
            </Link>
          </div>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <span className={styles.label}>Priority</span>
            <p className={styles.value}>{incident.priority}</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Owner</span>
            <p className={styles.value}>{incident.owner}</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Assets</span>
            <p className={styles.value}>{incident.assetIds.length}</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Alerts</span>
            <p className={styles.value}>{incident.alertIds.length}</p>
          </article>
        </section>

        <section className={styles.list}>
          {relatedAssets.map((asset) => (
            <article key={asset.id} className={styles.listCard}>
              <h3 className={styles.listTitle}>
                <Link className={styles.actionLink} href={getAssetDetailHref(asset.id)}>
                  {asset.callsign} · {asset.name}
                </Link>
              </h3>
              <p className={styles.muted}>{asset.mission}</p>
            </article>
          ))}
          {relatedAlerts.map((alert) => (
            <article key={alert.id} className={styles.listCard}>
              <h3 className={styles.listTitle}>
                <Link className={styles.actionLink} href={getAlertDetailHref(alert.id)}>
                  {alert.title}
                </Link>
              </h3>
              <p className={styles.muted}>{alert.summary}</p>
            </article>
          ))}
        </section>
      </div>
    </ConsoleShell>
  );
}
