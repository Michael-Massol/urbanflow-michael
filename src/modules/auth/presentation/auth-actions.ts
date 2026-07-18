"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authenticateUser, registerUser } from "../application/auth-use-cases.ts";
import { SupabaseAuthGateway } from "../infrastructure/supabase/supabase-auth-gateway.ts";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";
import { getPublicServerConfig } from "@/modules/supabase/infrastructure/server-config";

export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const client = await createUserSupabaseClient();
    const config = getPublicServerConfig();
    const result = await authenticateUser(new SupabaseAuthGateway(client, config.siteUrl), {
      email: readString(formData, "email"),
      password: readString(formData, "password"),
    });
    if (!result.success) return { status: "error", message: result.message ?? "Connexion impossible." };
  } catch {
    return { status: "error", message: "L’authentification n’est pas encore configurée sur cet environnement." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const client = await createUserSupabaseClient();
    const config = getPublicServerConfig();
    const result = await registerUser(new SupabaseAuthGateway(client, config.siteUrl), {
      displayName: readString(formData, "displayName"),
      email: readString(formData, "email"),
      password: readString(formData, "password"),
    });
    if (!result.success) return { status: "error", message: result.message ?? "Inscription impossible." };
    if (result.requiresEmailConfirmation) return { status: "success", message: result.message ?? "Compte créé." };
  } catch {
    return { status: "error", message: "L’inscription n’est pas encore configurée sur cet environnement." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  try {
    const client = await createUserSupabaseClient();
    const config = getPublicServerConfig();
    await new SupabaseAuthGateway(client, config.siteUrl).signOut();
  } finally {
    revalidatePath("/", "layout");
    redirect("/connexion");
  }
}
