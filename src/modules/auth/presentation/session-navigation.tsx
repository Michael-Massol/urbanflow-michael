import Link from "next/link";
import { getServerUserId } from "../infrastructure/get-server-user-id";
import { signOutAction } from "./auth-actions";

export async function SessionNavigation() {
  const isAuthenticated = Boolean(await getServerUserId());

  if (isAuthenticated) {
    return (
      <nav aria-label="Navigation principale">
        <Link href="/planifier">Planifier</Link>
        <Link href="/dashboard">Tableau de bord</Link>
        <Link href="/historique">Historique</Link>
        <Link href="/profil">Mon profil</Link>
        <Link href="/confidentialite">Confidentialité</Link>
        <form action={signOutAction}>
          <button className="nav-button" type="submit">Déconnexion</button>
        </form>
      </nav>
    );
  }

  return (
    <nav aria-label="Navigation principale">
      <Link href="/planifier">Planifier</Link>
      <Link href="/politique-de-confidentialite">Confidentialité</Link>
      <Link href="/connexion">Connexion</Link>
      <Link className="button button-small" href="/inscription">Créer un compte</Link>
    </nav>
  );
}
