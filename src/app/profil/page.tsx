import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { signOutAction } from "@/modules/auth/presentation/auth-actions";
import { defaultMobilityPreferences } from "@/modules/profile/domain/mobility-preferences";
import { SupabaseMobilityPreferencesRepository } from "@/modules/profile/infrastructure/supabase-mobility-preferences-repository";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import { ProfileForm } from "@/modules/profile/presentation/profile-form";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";

export const metadata: Metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/connexion");

  const client = await createUserSupabaseClient();
  const [profile, preferences] = await Promise.all([
    new SupabaseProfileRepository(client).findByUserId(userId),
    new SupabaseMobilityPreferencesRepository(client).findByUserId(userId),
  ]);
  const mobility = preferences ?? defaultMobilityPreferences;

  return (
    <section className="page-shell">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Votre espace</p>
          <h1>Mon profil</h1>
          <Link className="text-link" href="/dashboard">Retour au tableau de bord</Link>
        </div>
        <form action={signOutAction}><button className="button button-secondary" type="submit">Se déconnecter</button></form>
      </div>
      <div className="auth-card">
        <ProfileForm
          displayName={profile?.displayName ?? ""}
          preferredModes={mobility.preferredModes}
          avoidedModes={mobility.avoidedModes}
          maxWalkingMinutes={mobility.maxWalkingMinutes}
          reducedMobility={mobility.reducedMobility}
        />
      </div>
    </section>
  );
}
