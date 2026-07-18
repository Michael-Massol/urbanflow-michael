import type { Metadata } from "next";
import { SignInForm } from "@/modules/auth/presentation/auth-form";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  return <section className="auth-shell"><div className="auth-card"><p className="eyebrow">Votre espace</p><h1>Connexion</h1><p>Retrouvez votre profil UrbanFlow.</p><SignInForm /></div></section>;
}
