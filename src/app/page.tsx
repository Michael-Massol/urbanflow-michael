import Link from "next/link";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { getServerTransportProvider } from "@/modules/journey-planning/infrastructure/get-server-transport-provider";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ compte?: string }>;
}) {
  const accountDeleted = (await searchParams).compte === "supprime";
  const isAuthenticated = Boolean(await getServerUserId());
  const provider = getServerTransportProvider().descriptor;
  return (
    <>
      <section className="hero page-shell">
        {accountDeleted ? (
          <p className="form-message form-message-success" role="status">
            Votre compte et les données associées ont été supprimés.
          </p>
        ) : null}
        <p className="eyebrow">Mobilité toulousaine</p>
        <h1>Préparez des déplacements plus simples et plus durables.</h1>
        <p className="hero-copy">
          UrbanFlow réunira vos préférences de mobilité, vos itinéraires multimodaux et leur impact carbone dans une application installable.
        </p>
        <div className="actions">
          <Link className="button" href="/planifier">Planifier un trajet</Link>
          {!isAuthenticated ? (
            <Link className="button button-secondary" href="/connexion">J’ai déjà un compte</Link>
          ) : null}
        </div>
      </section>
      <section className="page-shell" aria-labelledby="v1-title">
        <div className={provider.isDemo ? "demo-warning" : "notice"} role="status">
          <strong>{provider.isDemo ? provider.notice : "Tisséo disponible"}</strong>
          <span>{provider.isDemo ? "Le mode de démonstration est explicitement activé." : provider.notice}</span>
        </div>
        <h2 id="v1-title">Le socle UrbanFlow</h2>
        <div className="feature-grid">
          <article className="card"><h3>Profil personnel</h3><p>Un compte sécurisé et un profil limité aux informations utiles.</p></article>
          <article className="card"><h3>Application installable</h3><p>Une expérience mobile-first avec un état hors ligne explicite.</p></article>
          <article className="card"><h3>Respect des données</h3><p>La position est demandée uniquement après votre accord et n’est jamais enregistrée.</p></article>
        </div>
      </section>
    </>
  );
}
