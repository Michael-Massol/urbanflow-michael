import type { AuthGateway, AuthResult, Credentials, RegistrationRequest } from "../domain/auth-models.ts";
import { credentialsSchema, registrationSchema } from "./auth-schemas.ts";

export async function authenticateUser(gateway: AuthGateway, input: Credentials): Promise<AuthResult> {
  const validation = credentialsSchema.safeParse(input);
  if (!validation.success) return { success: false, message: validation.error.issues[0]?.message ?? "Identifiants invalides." };
  return gateway.signIn(validation.data);
}

export async function registerUser(gateway: AuthGateway, input: RegistrationRequest): Promise<AuthResult> {
  const validation = registrationSchema.safeParse(input);
  if (!validation.success) return { success: false, message: validation.error.issues[0]?.message ?? "Informations invalides." };
  return gateway.signUp(validation.data);
}
