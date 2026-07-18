import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthGateway, AuthResult, Credentials, RegistrationRequest } from "../../domain/auth-models.ts";

export class SupabaseAuthGateway implements AuthGateway {
  constructor(
    private readonly client: SupabaseClient,
    private readonly siteUrl: string,
  ) {}

  async signIn(credentials: Credentials): Promise<AuthResult> {
    const { error } = await this.client.auth.signInWithPassword(credentials);
    if (error) return { success: false, message: "E-mail ou mot de passe incorrect." };
    return { success: true };
  }

  async signUp(request: RegistrationRequest): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        emailRedirectTo: `${this.siteUrl}/auth/confirm`,
        data: { display_name: request.displayName },
      },
    });
    if (error) return { success: false, message: "Impossible de créer le compte. Vérifiez les informations saisies." };
    return {
      success: true,
      requiresEmailConfirmation: data.session === null,
      message: data.session === null
        ? "Compte créé. Consultez votre messagerie pour confirmer votre adresse."
        : "Compte créé avec succès.",
    };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }
}
