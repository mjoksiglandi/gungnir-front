import { ConsoleShell } from "@/widgets/console-shell";
import { MapStage } from "@/widgets/map-stage";
import { scenario } from "@/shared/mock/scenario";
import styles from "./page.module.css";

export default function OperationsPage() {
  return (
    <ConsoleShell activePath="/operations">
      <section className={styles.stage}>
        <MapStage
          alerts={scenario.alerts}
          assets={scenario.assets}
          incidents={scenario.incidents}
          layers={scenario.layers}
        />
      </section>
    </ConsoleShell>
  );
}
