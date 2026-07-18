"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, signUpAction, type AuthActionState } from "./auth-actions";

const initialAuthActionState: AuthActionState = { status: "idle" };

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, initialAuthActionState);
  return (
    <form action={action} className="form-stack" noValidate>
      <div className="field"><label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>
      {state.message ? <p className="form-message" role="alert">{state.message}</p> : null}
      <button className="button" type="submit" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</button>
      <p>Pas encore de compte ? <Link className="text-link" href="/inscription">Créer un compte</Link></p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initialAuthActionState);
  return (
    <form action={action} className="form-stack" noValidate>
      <div className="field"><label htmlFor="displayName">Nom affiché</label><input id="displayName" name="displayName" type="text" autoComplete="name" minLength={2} maxLength={60} required /><p className="field-hint">Utilisez un prénom ou un pseudonyme. Ne renseignez que le nécessaire.</p></div>
      <div className="field"><label htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /><p className="field-hint">8 caractères minimum.</p></div>
      {state.message ? <p className={`form-message ${state.status === "success" ? "form-message-success" : ""}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
      <button className="button" type="submit" disabled={pending}>{pending ? "Création…" : "Créer mon compte"}</button>
      <p>Déjà inscrit ? <Link className="text-link" href="/connexion">Se connecter</Link></p>
    </form>
  );
}
