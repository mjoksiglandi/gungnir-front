import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth";
import styles from "@/app/entity-detail.module.css";
import { operationalDataGateway } from "@/shared/data";
import { formatTime } from "@/shared/lib/format";
import {
  buildOperationsHref,
  getAssetDetailHref,
  getIncidentDetailHref,
} from "@/shared/navigation/entity-routes";
import { ConsoleShell } from "@/widgets/console-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const alert = await operationalDataGateway.getEntity("alert", id);

  if (!alert) {
    return {
      title: "Alert not found",
    };
  }

  return {
    title: `${alert.title} | Alert`,
    description: alert.summary,
  };
}

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuthenticatedUser();
  const { id } = await params;
  const alert = await operationalDataGateway.getEntity("alert", id);

  if (!alert) {
    notFound();
  }

  const [asset, incidents] = await Promise.all([
    alert.assetId ? operationalDataGateway.getEntity("asset", alert.assetId) : Promise.resolve(null),
    operationalDataGateway.getIncidents(),
  ]);

  const relatedIncidents = incidents.filter((incident) => incident.alertIds.includes(alert.id));

  return (
    <ConsoleShell activePath={`/alerts/${alert.id}`}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Alert detail</p>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{alert.title}</h2>
            <span className={styles.status}>{alert.severity} · {alert.status}</span>
          </div>
          <p className={styles.muted}>{alert.summary}</p>
          <div className={styles.actions}>
            <Link className={styles.actionLink} href={buildOperationsHref({ alertId: alert.id })}>
              Open in operations
            </Link>
            <Link className={styles.actionLink} href="/alerts">
              Back to alerts
            </Link>
          </div>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <span className={styles.label}>Observed at</span>
            <p className={styles.value}>{formatTime(alert.observedAt)} UTC</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Source</span>
            <p className={styles.value}>{alert.source}</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Linked asset</span>
            <p className={styles.value}>{asset ? asset.callsign : "Not linked"}</p>
          </article>
        </section>

        <section className={styles.list}>
          {asset ? (
            <article className={styles.listCard}>
              <h3 className={styles.listTitle}>
                <Link className={styles.actionLink} href={getAssetDetailHref(asset.id)}>
                  {asset.callsign} · {asset.name}
                </Link>
              </h3>
              <p className={styles.muted}>{asset.mission}</p>
            </article>
          ) : null}
          {relatedIncidents.map((incident) => (
            <article key={incident.id} className={styles.listCard}>
              <h3 className={styles.listTitle}>
                <Link className={styles.actionLink} href={getIncidentDetailHref(incident.id)}>
                  {incident.title}
                </Link>
              </h3>
              <p className={styles.muted}>{incident.summary}</p>
            </article>
          ))}
        </section>
      </div>
    </ConsoleShell>
  );
}
