import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { signOutAction } from "@/modules/auth/presentation/auth-actions";
import { getCarbonSummary } from "@/modules/carbon-tracking/application/get-carbon-summary";
import { SupabaseCompletedJourneyRepository } from "@/modules/carbon-tracking/infrastructure/supabase-completed-journey-repository";
import { createDashboardViewModel } from "@/modules/dashboard/application/create-dashboard-view-model";
import { SupabaseMobilityPreferencesRepository } from "@/modules/profile/infrastructure/supabase-mobility-preferences-repository";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";
import { getServerTransportDiagnostics } from "@/modules/transport/infrastructure/get-server-transport-diagnostics";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/connexion");
  const client = await createUserSupabaseClient();
  const [profile, preferences, diagnostics, completedJourneys] = await Promise.all([
    new SupabaseProfileRepository(client).findByUserId(userId),
    new SupabaseMobilityPreferencesRepository(client).findByUserId(userId),
    getServerTransportDiagnostics(),
    new SupabaseCompletedJourneyRepository(client).listByUserId(userId),
  ]);
  const viewModel = createDashboardViewModel({ profile, preferences, provider: diagnostics.provider });
  const carbonSummary = getCarbonSummary(completedJourneys);

  return (
    <section className="dashboard-shell">
      <div className="dashboard-header">
        <div><p className="eyebrow">Votre espace</p><h1>{viewModel.greeting}</h1><p>{viewModel.profileStatusLabel} · Fournisseur : {viewModel.providerLabel}</p></div>
        <form action={signOutAction}><button className="button button-secondary" type="submit">Se déconnecter</button></form>
      </div>
      <aside className="notice" aria-label="Résumé carbone">
        <strong>Votre bilan carbone</strong>
        <span>{carbonSummary.journeyCount} trajet(s) confirmé(s) · {carbonSummary.emissionsGramsCo2e.toLocaleString("fr-FR")} g CO₂e estimés · {carbonSummary.avoidedGramsCo2e.toLocaleString("fr-FR")} g CO₂e évités face à la voiture thermique.</span>
        <Link className="text-link" href="/historique" prefetch={false}>Consulter l’historique</Link>
      </aside>
      <div className="dashboard-grid">
        {viewModel.features.map((feature) => (
          <article className="dashboard-card" key={feature.title}>
            <span className={`status-pill status-${feature.status}`}>{feature.status === "available" ? "Disponible" : "À venir"}</span>
            <h2>{feature.title}</h2><p>{feature.description}</p>
            {feature.href ? <Link className="text-link" href={feature.href} prefetch={false}>Ouvrir</Link> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
