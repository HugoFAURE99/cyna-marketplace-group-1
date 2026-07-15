"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            fontFamily: "Arial, sans-serif",
            gap: "1rem",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1>Une erreur inattendue est survenue.</h1>
          <p>L’incident a été signalé. Vous pouvez réessayer immédiatement.</p>
          <button onClick={reset} type="button">
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
