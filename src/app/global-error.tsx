"use client";

import { THEME_INITIALIZATION_SCRIPT } from "@/modules/theme/presentation/theme-initialization";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          id="urbanflow-theme-initialization"
          dangerouslySetInnerHTML={{ __html: THEME_INITIALIZATION_SCRIPT }}
        />
      </head>
      <body>
        <main className="page-shell error-page" role="alert">
          <h1>UrbanFlow est temporairement indisponible</h1>
          <p>Réessayez. Si le problème persiste, revenez plus tard.</p>
          <button className="button" type="button" onClick={reset}>Réessayer</button>
        </main>
      </body>
    </html>
  );
}
