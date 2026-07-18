"use client";

export default function ApplicationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="page-shell error-page" role="alert">
      <p className="eyebrow">Service indisponible</p>
      <h1>Une erreur est survenue</h1>
      <p>
        UrbanFlow n’a pas pu charger cette page. Aucun détail technique ni donnée personnelle n’est affiché.
      </p>
      <button className="button" type="button" onClick={reset}>Réessayer</button>
    </section>
  );
}
