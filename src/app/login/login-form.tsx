"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "./page.module.css";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        setError(payload?.error?.message ?? "Unable to sign in.");
        return;
      }

      router.replace("/operations");
      router.refresh();
    });
  }

  return (
    <form
      className={styles.form}
      action={(formData) => {
        handleSubmit(formData);
      }}
    >
      <label className={styles.field}>
        <span>Email</span>
        <input defaultValue="admin@gungnir.local" name="email" type="email" />
      </label>
      <label className={styles.field}>
        <span>Password</span>
        <input defaultValue="admin12345" name="password" type="password" />
      </label>
      {error ? <p className={styles.error}>{error}</p> : null}
      <button className={styles.submit} disabled={pending} type="submit">
        {pending ? "Connecting..." : "Enter Operations"}
      </button>
    </form>
  );
}
