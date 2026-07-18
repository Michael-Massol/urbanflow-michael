import assert from "node:assert/strict";
import test from "node:test";
import { authenticateUser, registerUser } from "../../src/modules/auth/application/auth-use-cases.ts";
import type { AuthGateway, AuthResult } from "../../src/modules/auth/domain/auth-models.ts";

class FakeAuthGateway implements AuthGateway {
  signInCalls = 0;
  signUpCalls = 0;

  async signIn(): Promise<AuthResult> {
    this.signInCalls += 1;
    return { success: true };
  }

  async signUp(): Promise<AuthResult> {
    this.signUpCalls += 1;
    return { success: true };
  }

  async signOut(): Promise<void> {}
}

test("authentication rejects invalid input before calling infrastructure", async () => {
  const gateway = new FakeAuthGateway();
  const result = await authenticateUser(gateway, { email: "invalid", password: "short" });
  assert.equal(result.success, false);
  assert.equal(gateway.signInCalls, 0);
});

test("authentication delegates validated credentials", async () => {
  const gateway = new FakeAuthGateway();
  const result = await authenticateUser(gateway, { email: "USER@example.com", password: "valid-password" });
  assert.equal(result.success, true);
  assert.equal(gateway.signInCalls, 1);
});

test("registration validates the minimal profile", async () => {
  const gateway = new FakeAuthGateway();
  const invalid = await registerUser(gateway, { email: "user@example.com", password: "valid-password", displayName: " " });
  assert.equal(invalid.success, false);
  assert.equal(gateway.signUpCalls, 0);
  const valid = await registerUser(gateway, { email: "user@example.com", password: "valid-password", displayName: "Alex" });
  assert.equal(valid.success, true);
  assert.equal(gateway.signUpCalls, 1);
});
