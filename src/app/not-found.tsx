import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-state">
      <div className="system-state__panel">
        <p className="system-state__eyebrow">404</p>
        <h1 className="system-state__title">Route not found</h1>
        <p className="system-state__copy">
          The requested console view does not exist or is no longer available in this deployment.
        </p>
        <div className="system-state__actions">
          <Link href="/operations" className="system-state__action">
            Return to operations
          </Link>
          <Link href="/assets" className="system-state__action system-state__action--secondary">
            Open asset registry
          </Link>
        </div>
      </div>
    </main>
  );
}
