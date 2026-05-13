import { ConsoleShell } from "@/widgets/console-shell";
import { MapStage } from "@/widgets/map-stage";
import { operationalDataGateway } from "@/shared/data";
import styles from "./page.module.css";

export default async function OperationsPage() {
  const snapshot = await operationalDataGateway.getSnapshot();

  return (
    <ConsoleShell activePath="/operations">
      <section className={styles.stage}>
        <MapStage
          alerts={snapshot.alerts}
          assets={snapshot.assets}
          incidents={snapshot.incidents}
          layers={snapshot.layers}
        />
      </section>
    </ConsoleShell>
  );
}
