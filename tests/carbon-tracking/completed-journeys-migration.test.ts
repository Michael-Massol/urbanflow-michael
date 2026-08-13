import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("completed journeys are exposed only to authenticated users before owner RLS applies", async () => {
  const migrations = await Promise.all([
    readFile("supabase/migrations/202607180001_create_completed_journeys.sql", "utf8"),
    readFile("supabase/migrations/202607180002_grant_completed_journeys_access.sql", "utf8"),
    readFile("supabase/migrations/202607180003_make_completed_journeys_immutable.sql", "utf8"),
  ]);
  const migration = migrations.join("\n");
  assert.match(migration, /revoke all on public\.completed_journeys from anon/i);
  assert.match(
    migration,
    /grant select, insert, delete on public\.completed_journeys to authenticated/i,
  );
  assert.match(migration, /alter table public\.completed_journeys enable row level security/i);
  assert.match(migration, /revoke update on public\.completed_journeys from authenticated/i);
  assert.doesNotMatch(migration, /create policy[^;]*update/i);
});

test("confirmed journey geometry is nullable, constrained and stored in the owner row", async () => {
  const migration = await readFile(
    "supabase/migrations/202608130001_add_completed_journey_geometry.sql",
    "utf8",
  );

  assert.match(migration, /add column if not exists geometry_snapshot jsonb null/i);
  assert.match(migration, /geometry_snapshot ->> 'type' = 'LineString'/i);
  assert.match(migration, /jsonb_array_length\(geometry_snapshot -> 'coordinates'\) >= 2/i);
  assert.doesNotMatch(migration, /create table/i);
});
