"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
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
