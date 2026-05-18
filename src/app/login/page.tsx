import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { serverApiClient } from "@/lib/api-server";
import { LoginForm } from "./login-form";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  try {
    await serverApiClient.getMe();
    redirect("/operations");
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Gungnir access</p>
        <h1 className={styles.title}>Realtime C4 / COP console</h1>
        <p className={styles.copy}>
          Sign in to connect the operational map, commands, telemetry, alerts, and mission state to the NestJS backend.
        </p>
        <LoginForm />
        <p className={styles.credentials}>
          Seed credentials: <strong>admin@gungnir.local</strong> / <strong>admin12345</strong>
        </p>
      </section>
    </main>
  );
}
