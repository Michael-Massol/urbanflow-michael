import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  throw new Error(
    "Test RLS impossible : renseigne NEXT_PUBLIC_SUPABASE_URL, " +
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY et SUPABASE_SECRET_KEY dans .env.local.",
  );
}

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

interface SupabaseResultWithError {
  error: { code?: string; message: string } | null;
}

const jwtClockSkewRetryDelaysMs = [250, 500, 1_000, 2_000, 4_000] as const;

function isJwtIssuedInFuture(error: SupabaseResultWithError["error"]): boolean {
  return error?.code === "PGRST303" && /JWT issued at future/i.test(error.message);
}

async function retryJwtClockSkew<T extends SupabaseResultWithError>(
  operation: () => PromiseLike<T>,
): Promise<T> {
  let result = await operation();

  for (const delayMs of jwtClockSkewRetryDelaysMs) {
    if (!isJwtIssuedInFuture(result.error)) return result;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    result = await operation();
  }

  return result;
}

test("RLS isolates profiles, mobility preferences and completed journeys for two authenticated users", async () => {
  const admin = createClient(url, secretKey, clientOptions);
  const password = `Rls-${randomUUID()}-aA1!`;
  const runId = randomUUID();
  const createdUserIds: string[] = [];

  try {
    const users = await Promise.all(
      ["Alpha", "Beta"].map(async (displayName, index) => {
        const email = `urbanflow-rls-${runId}-${index}@example.invalid`;
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: displayName },
        });
        assert.ifError(error);
        assert.ok(data.user, "Supabase doit retourner l’utilisateur temporaire créé");
        createdUserIds.push(data.user.id);
        return { id: data.user.id, email, displayName };
      }),
    );

    const [userA, userB] = users;
    assert.ok(userA && userB);

    const clientA = createClient(url, publishableKey, clientOptions);
    const clientB = createClient(url, publishableKey, clientOptions);
    const [sessionA, sessionB] = await Promise.all([
      clientA.auth.signInWithPassword({ email: userA.email, password }),
      clientB.auth.signInWithPassword({ email: userB.email, password }),
    ]);
    assert.ifError(sessionA.error);
    assert.ifError(sessionB.error);

    const [visibleToA, visibleToB] = await Promise.all([
      retryJwtClockSkew(() => clientA.from("profiles").select("user_id, display_name")),
      retryJwtClockSkew(() => clientB.from("profiles").select("user_id, display_name")),
    ]);
    assert.ifError(visibleToA.error);
    assert.ifError(visibleToB.error);
    assert.deepEqual(visibleToA.data?.map(({ user_id }) => user_id), [userA.id]);
    assert.deepEqual(visibleToB.data?.map(({ user_id }) => user_id), [userB.id]);

    const [preferencesVisibleToA, preferencesVisibleToB] = await Promise.all([
      retryJwtClockSkew(() => clientA.from("mobility_preferences").select("user_id, max_walking_minutes")),
      retryJwtClockSkew(() => clientB.from("mobility_preferences").select("user_id, max_walking_minutes")),
    ]);
    assert.ifError(preferencesVisibleToA.error);
    assert.ifError(preferencesVisibleToB.error);
    assert.deepEqual(preferencesVisibleToA.data?.map(({ user_id }) => user_id), [userA.id]);
    assert.deepEqual(preferencesVisibleToB.data?.map(({ user_id }) => user_id), [userB.id]);

    const completedJourney = {
      user_id: userA.id,
      origin_label: "Capitole",
      destination_label: "Jean-Jaurès",
      departure_at: new Date().toISOString(),
      arrival_at: new Date(Date.now() + 600_000).toISOString(),
      duration_minutes: 10,
      distance_meters: 1200,
      modes: ["metro"],
      emissions_grams_co2e: 5.33,
      car_reference_grams_co2e: 170.4,
      avoided_grams_co2e: 165.07,
      factor_version: "urbanflow-ademe-2025.1",
      provider: "demo",
    };
    const ownJourneyInsert = await clientA.from("completed_journeys").insert(completedJourney).select("id, user_id").single();
    assert.ifError(ownJourneyInsert.error);
    assert.equal(ownJourneyInsert.data.user_id, userA.id);
    const [journeysVisibleToA, journeysVisibleToB] = await Promise.all([
      clientA.from("completed_journeys").select("user_id"),
      clientB.from("completed_journeys").select("user_id"),
    ]);
    assert.ifError(journeysVisibleToA.error);
    assert.ifError(journeysVisibleToB.error);
    assert.deepEqual(journeysVisibleToA.data?.map(({ user_id }) => user_id), [userA.id]);
    assert.deepEqual(journeysVisibleToB.data, []);
    const crossJourneyInsert = await clientA.from("completed_journeys").insert({ ...completedJourney, user_id: userB.id });
    const anonymous = createClient(url, publishableKey, clientOptions);
    const anonymousJourneyInsert = await anonymous.from("completed_journeys").insert(completedJourney);
    assert.ok(anonymousJourneyInsert.error, "Une insertion non authentifiée doit être refusée");

    const journeyUpdate = await clientA.from("completed_journeys")
      .update({ duration_minutes: 99 })
      .eq("id", ownJourneyInsert.data.id)
      .select("duration_minutes");
    if (!journeyUpdate.error) {
      assert.deepEqual(journeyUpdate.data, [], "Aucune ligne confirmée ne doit être modifiable");
    }
    const journeyAfterUpdate = await admin.from("completed_journeys")
      .select("duration_minutes")
      .eq("id", ownJourneyInsert.data.id)
      .single();
    assert.ifError(journeyAfterUpdate.error);
    assert.equal(journeyAfterUpdate.data.duration_minutes, 10, "Le trajet confirmé doit rester immuable");

    const crossJourneyDelete = await clientB.from("completed_journeys")
      .delete()
      .eq("id", ownJourneyInsert.data.id)
      .select("id");
    assert.ifError(crossJourneyDelete.error);
    assert.deepEqual(crossJourneyDelete.data, [], "B ne peut pas supprimer le trajet de A");
    const journeyAfterCrossDelete = await admin.from("completed_journeys")
      .select("id")
      .eq("id", ownJourneyInsert.data.id)
      .single();
    assert.ifError(journeyAfterCrossDelete.error);

    const ownJourneyDelete = await clientA.from("completed_journeys")
      .delete()
      .eq("id", ownJourneyInsert.data.id)
      .select("id")
      .single();
    assert.ifError(ownJourneyDelete.error);
    assert.equal(ownJourneyDelete.data.id, ownJourneyInsert.data.id);
    const journeyAfterOwnDelete = await admin.from("completed_journeys")
      .select("id")
      .eq("id", ownJourneyInsert.data.id)
      .maybeSingle();
    assert.ifError(journeyAfterOwnDelete.error);
    assert.equal(journeyAfterOwnDelete.data, null, "A peut supprimer son propre trajet");
    assert.ok(crossJourneyInsert.error, "RLS doit refuser un trajet attribué à un autre utilisateur");

    const crossUpdate = await clientA
      .from("profiles")
      .update({ display_name: "Compromis" })
      .eq("user_id", userB.id)
      .select("user_id");
    assert.ifError(crossUpdate.error);
    assert.deepEqual(crossUpdate.data, [], "RLS doit masquer le profil B au client A");

    const { data: profileB, error: profileBError } = await admin
      .from("profiles")
      .select("display_name")
      .eq("user_id", userB.id)
      .single();
    assert.ifError(profileBError);
    assert.equal(profileB.display_name, userB.displayName);

    const crossPreferencesUpdate = await clientA
      .from("mobility_preferences")
      .update({ max_walking_minutes: 99 })
      .eq("user_id", userB.id)
      .select("user_id");
    assert.ifError(crossPreferencesUpdate.error);
    assert.deepEqual(crossPreferencesUpdate.data, [], "RLS doit masquer les préférences B au client A");

    const { data: preferencesB, error: preferencesBError } = await admin
      .from("mobility_preferences")
      .select("max_walking_minutes")
      .eq("user_id", userB.id)
      .single();
    assert.ifError(preferencesBError);
    assert.equal(preferencesB.max_walking_minutes, 20);

    const ownUpdate = await clientA
      .from("profiles")
      .update({ display_name: "Alpha modifié" })
      .eq("user_id", userA.id)
      .select("display_name")
      .single();
    assert.ifError(ownUpdate.error);
    assert.equal(ownUpdate.data.display_name, "Alpha modifié");
    const ownPreferencesUpdate = await clientA
      .from("mobility_preferences")
      .update({ preferred_modes: ["metro"], max_walking_minutes: 12 })
      .eq("user_id", userA.id)
      .select("preferred_modes, max_walking_minutes")
      .single();
    assert.ifError(ownPreferencesUpdate.error);
    assert.deepEqual(ownPreferencesUpdate.data.preferred_modes, ["metro"]);
    assert.equal(ownPreferencesUpdate.data.max_walking_minutes, 12);

    const cascadeJourneyInsert = await clientA.from("completed_journeys")
      .insert(completedJourney)
      .select("id")
      .single();
    assert.ifError(cascadeJourneyInsert.error);
    const accountDeletion = await admin.auth.admin.deleteUser(userA.id);
    assert.ifError(accountDeletion.error);
    createdUserIds.splice(createdUserIds.indexOf(userA.id), 1);

    const [profileAfterDeletion, preferencesAfterDeletion, journeysAfterDeletion] = await Promise.all([
      admin.from("profiles").select("user_id").eq("user_id", userA.id),
      admin.from("mobility_preferences").select("user_id").eq("user_id", userA.id),
      admin.from("completed_journeys").select("user_id").eq("user_id", userA.id),
    ]);
    assert.ifError(profileAfterDeletion.error);
    assert.ifError(preferencesAfterDeletion.error);
    assert.ifError(journeysAfterDeletion.error);
    assert.deepEqual(profileAfterDeletion.data, [], "La suppression du compte efface le profil");
    assert.deepEqual(preferencesAfterDeletion.data, [], "La suppression du compte efface les préférences");
    assert.deepEqual(journeysAfterDeletion.data, [], "La suppression du compte efface les trajets");
  } finally {
    await Promise.all(createdUserIds.map((userId) => admin.auth.admin.deleteUser(userId)));
  }
});
