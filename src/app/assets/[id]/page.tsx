import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/entity-detail.module.css";
import { operationalDataGateway } from "@/shared/data";
import { formatPercent } from "@/shared/lib/format";
import {
  buildOperationsHref,
  getAlertDetailHref,
} from "@/shared/navigation/entity-routes";
import { ConsoleShell } from "@/widgets/console-shell";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await operationalDataGateway.getEntity("asset", id);

  if (!asset) {
    notFound();
  }

  const [incidents, alerts] = await Promise.all([
    operationalDataGateway.getIncidents(),
    operationalDataGateway.getAlerts(),
  ]);

  const relatedIncidents = incidents.filter((incident) => incident.assetIds.includes(asset.id));
  const relatedAlerts = alerts.filter((alert) => alert.assetId === asset.id);

  return (
    <ConsoleShell activePath={`/assets/${asset.id}`}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Asset detail</p>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{asset.callsign} · {asset.name}</h2>
            <span className={styles.status}>{asset.status}</span>
          </div>
          <p className={styles.muted}>{asset.mission}</p>
          <div className={styles.actions}>
            <Link className={styles.actionLink} href={buildOperationsHref({ assetId: asset.id })}>
              Open in operations
            </Link>
            <Link className={styles.actionLink} href="/assets">
              Back to assets
            </Link>
          </div>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <span className={styles.label}>Type</span>
            <p className={styles.value}>{asset.assetType}</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Battery</span>
            <p className={styles.value}>{formatPercent(asset.batteryPct)}</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Link quality</span>
            <p className={styles.value}>{formatPercent(asset.linkQualityPct)}</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Heading</span>
            <p className={styles.value}>{asset.position.headingDeg ?? 0}°</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Altitude</span>
            <p className={styles.value}>{asset.position.altM ?? 0} m</p>
          </article>
          <article className={styles.card}>
            <span className={styles.label}>Speed</span>
            <p className={styles.value}>{asset.position.speedMps ?? 0} km/h</p>
          </article>
        </section>

        <section className={styles.list}>
          {relatedIncidents.map((incident) => (
            <article key={incident.id} className={styles.listCard}>
              <h3 className={styles.listTitle}>{incident.title}</h3>
              <p className={styles.muted}>{incident.summary}</p>
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
