import assert from "node:assert/strict";
import test from "node:test";
import { updateProfile } from "../../src/modules/profile/application/update-profile.ts";
import type { Profile, ProfileRepository } from "../../src/modules/profile/domain/profile.ts";

class FakeProfileRepository implements ProfileRepository {
  updatedName: string | null = null;

  async findByUserId(): Promise<Profile | null> { return null; }

  async updateDisplayName(userId: string, displayName: string): Promise<Profile> {
    this.updatedName = displayName;
    return { userId, displayName, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
  }
}

test("profile update trims and validates the display name", async () => {
  const repository = new FakeProfileRepository();
  const profile = await updateProfile(repository, {
    userId: "b7a55d4a-8a35-4b49-8bd8-d6d947c72f68",
    displayName: "  Camille  ",
  });
  assert.equal(profile.displayName, "Camille");
  assert.equal(repository.updatedName, "Camille");
});

test("profile update rejects invalid identifiers and names", async () => {
  const repository = new FakeProfileRepository();
  await assert.rejects(updateProfile(repository, { userId: "invalid", displayName: "A" }), {
    name: "ZodError",
  });
  assert.equal(repository.updatedName, null);
});
