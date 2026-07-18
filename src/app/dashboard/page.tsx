import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { signOutAction } from "@/modules/auth/presentation/auth-actions";
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
  const [profile, preferences, diagnostics] = await Promise.all([
    new SupabaseProfileRepository(client).findByUserId(userId),
    new SupabaseMobilityPreferencesRepository(client).findByUserId(userId),
    getServerTransportDiagnostics(),
  ]);
  const viewModel = createDashboardViewModel({
    profile,
    preferences,
    provider: diagnostics.provider,
  });

  return (
    <section className="dashboard-shell">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Votre espace</p>
          <h1>{viewModel.greeting}</h1>
          <p>{viewModel.profileStatusLabel} · Fournisseur : {viewModel.providerLabel}</p>
        </div>
        <form action={signOutAction}><button className="button button-secondary" type="submit">Se déconnecter</button></form>
      </div>

      <aside className="notice" aria-label="État de la planification">
        <strong>Fonctionnalités V1</strong>
        <span>La planification d’itinéraires arrivera en V2.</span>
      </aside>

      <div className="dashboard-grid">
        {viewModel.features.map((feature) => (
          <article className="dashboard-card" key={feature.title}>
            <span className={`status-pill status-${feature.status}`}>{feature.status === "available" ? "Disponible" : "À venir"}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
            {feature.href ? <Link className="text-link" href={feature.href}>Ouvrir</Link> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
