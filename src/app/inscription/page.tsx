import type { Metadata } from "next";
import { SignUpForm } from "@/modules/auth/presentation/auth-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  return <section className="auth-shell"><div className="auth-card"><p className="eyebrow">Bienvenue</p><h1>Créer un compte</h1><p>Nous collectons uniquement les informations nécessaires au fonctionnement du service.</p><SignUpForm /></div></section>;
}
