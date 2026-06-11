import Link from "next/link";
import type { Metadata } from "next";
import { getBackendApiBaseUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Backend Unavailable",
  description: "The operational backend is currently unreachable from the Next.js frontend.",
};

export default function BackendUnavailablePage() {
  const backendUrl = getBackendApiBaseUrl();

  return (
    <main className="system-state">
      <div className="system-state__panel">
        <p className="system-state__eyebrow">Backend offline</p>
        <h1 className="system-state__title">The console cannot reach its backend</h1>
        <p className="system-state__copy">
          Next.js is configured to contact <code>{backendUrl}</code>, but that address is not reachable right now.
          Start the backend service or update <code>BACKEND_API_URL</code> if the API moved.
        </p>
        <div className="system-state__actions">
          <Link href="/operations" className="system-state__action">
            Retry operations
          </Link>
          <Link href="/login" className="system-state__action system-state__action--secondary">
            Go to login
          </Link>
        </div>
      </div>
    </main>
  );
}
