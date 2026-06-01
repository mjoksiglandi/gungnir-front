import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth";
import { ConsoleShell } from "@/widgets/console-shell";
import { MapStage } from "@/widgets/map-stage";
import { getOperationsMapBootstrap } from "@/shared/data/operations-map-bootstrap";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Operations",
  description: "Geospatial operational console for live asset tracking, incident overlays, and command actions.",
};

export default async function OperationsPage() {
  await requireAuthenticatedUser();
  const bootstrap = await getOperationsMapBootstrap();

  return (
    <ConsoleShell activePath="/operations">
      <section className={styles.stage}>
        <MapStage bootstrap={bootstrap} />
      </section>
    </ConsoleShell>
  );
}
