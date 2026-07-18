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

test("RLS isolates profiles and mobility preferences for two authenticated users", async () => {
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
      clientA.from("profiles").select("user_id, display_name"),
      clientB.from("profiles").select("user_id, display_name"),
    ]);
    assert.ifError(visibleToA.error);
    assert.ifError(visibleToB.error);
    assert.deepEqual(visibleToA.data?.map(({ user_id }) => user_id), [userA.id]);
    assert.deepEqual(visibleToB.data?.map(({ user_id }) => user_id), [userB.id]);

    const [preferencesVisibleToA, preferencesVisibleToB] = await Promise.all([
      clientA.from("mobility_preferences").select("user_id, max_walking_minutes"),
      clientB.from("mobility_preferences").select("user_id, max_walking_minutes"),
    ]);
    assert.ifError(preferencesVisibleToA.error);
    assert.ifError(preferencesVisibleToB.error);
    assert.deepEqual(preferencesVisibleToA.data?.map(({ user_id }) => user_id), [userA.id]);
    assert.deepEqual(preferencesVisibleToB.data?.map(({ user_id }) => user_id), [userB.id]);

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
  } finally {
    await Promise.all(createdUserIds.map((userId) => admin.auth.admin.deleteUser(userId)));
  }
});
