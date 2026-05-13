import { ConsoleShell } from "@/widgets/console-shell";
import { scenario } from "@/shared/mock/scenario";
import { formatPercent } from "@/shared/lib/format";
import styles from "./page.module.css";

export default function AssetsPage() {
  return (
    <ConsoleShell activePath="/assets">
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Asset registry</p>
          <h2>Current tracked units</h2>
          <p className={styles.muted}>
            This roster is front-end only for now, but already structured to receive bootstrap API payloads or live stream upserts.
          </p>
        </section>
        <section className={styles.table}>
          <div className={styles.row}>
            <strong>Name</strong>
            <strong>Type</strong>
            <strong>Status</strong>
            <strong>Link</strong>
            <strong>Mission</strong>
          </div>
          {scenario.assets.map((asset) => (
            <div key={asset.id} className={styles.row}>
              <div>
                <strong>{asset.callsign}</strong>
                <p className={styles.muted}>{asset.name}</p>
              </div>
              <span>{asset.assetType}</span>
              <span>{asset.status}</span>
              <span>{formatPercent(asset.linkQualityPct)}</span>
              <span>{asset.mission}</span>
            </div>
          ))}
        </section>
      </div>
    </ConsoleShell>
  );
}
