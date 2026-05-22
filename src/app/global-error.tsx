"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: Readonly<{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="system-state">
          <div className="system-state__panel">
            <p className="system-state__eyebrow">System interruption</p>
            <h1 className="system-state__title">The console hit an unexpected fault</h1>
            <p className="system-state__copy">
              Refresh the route context and try again. If the issue persists, inspect the server logs using
              the error digest.
            </p>
            {error.digest ? <p className="system-state__digest">Digest: {error.digest}</p> : null}
            <button type="button" className="system-state__action" onClick={() => unstable_retry()}>
              Retry route
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
