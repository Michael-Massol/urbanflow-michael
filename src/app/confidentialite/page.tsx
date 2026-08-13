import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { getPrivacySummary } from "@/modules/privacy/application/get-privacy-summary";
import { SupabasePrivacyDataRepository } from "@/modules/privacy/infrastructure/supabase-privacy-data-repository";
import { DeleteAccountForm } from "@/modules/privacy/presentation/delete-account-form";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";

export const metadata: Metadata = { title: "Confidentialité et données" };
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/connexion");

  let summary = null;
  try {
    summary = await getPrivacySummary(
      new SupabasePrivacyDataRepository(await createUserSupabaseClient()),
      userId,
    );
  } catch {
    // The page remains usable and does not expose an infrastructure error.
  }

  return (
    <section className="page-shell privacy-page">
      <p className="eyebrow">Vos droits</p>
      <h1>Confidentialité et données personnelles</h1>
      <p>
        UrbanFlow limite les données conservées au profil, aux préférences de mobilité et aux trajets
        que vous confirmez explicitement comme effectués.
      </p>

      <div className="privacy-grid">
        <article className="dashboard-card">
          <h2>Données enregistrées</h2>
          {summary ? (
            <dl className="privacy-summary">
              <div><dt>Profil</dt><dd>{summary.hasProfile ? "Enregistré" : "Absent"}</dd></div>
              <div><dt>Préférences</dt><dd>{summary.hasMobilityPreferences ? "Enregistrées" : "Absentes"}</dd></div>
              <div><dt>Trajets confirmés</dt><dd>{summary.completedJourneyCount}</dd></div>
              <div><dt>Tracé des trajets confirmés</dt><dd>{summary.storesConfirmedJourneyGeometry ? "Enregistré" : "Absent"}</dd></div>
            </dl>
          ) : (
            <p className="form-message" role="status">
              Le résumé ne peut pas être chargé pour le moment. Aucune information technique n’a été exposée.
            </p>
          )}
          <Link className="text-link" href="/politique-de-confidentialite">
            Lire la politique de confidentialité
          </Link>
        </article>

        <article className="dashboard-card">
          <h2>Exporter mes données</h2>
          <p>
            Téléchargez un fichier JSON contenant uniquement vos données UrbanFlow, les tracés des trajets
            confirmés lorsqu’ils existent et votre résumé carbone.
            Les mots de passe, jetons, clés et réponses brutes des fournisseurs en sont exclus.
          </p>
          <a className="button" href="/api/privacy/export" download>
            Télécharger mon export JSON
          </a>
        </article>
      </div>

      <section className="danger-section" aria-labelledby="delete-account-title">
        <h2 id="delete-account-title">Supprimer mon compte</h2>
        <p>
          La suppression efface le compte d’authentification et, par cascade, le profil, les préférences
          et l’historique des trajets. Exportez d’abord vos données si vous souhaitez les conserver.
        </p>
        <DeleteAccountForm />
      </section>
    </section>
  );
}
