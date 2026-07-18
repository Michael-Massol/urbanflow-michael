import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Connexion indisponible</p>
        <h1>Vous êtes hors ligne</h1>
        <p>Le planificateur et votre profil nécessitent une connexion. Aucune donnée saisie n’a été envoyée.</p>
        <Link className="button" href="/">Réessayer</Link>
      </div>
    </section>
  );
}
