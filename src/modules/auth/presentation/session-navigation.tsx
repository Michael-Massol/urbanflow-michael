import Link from "next/link";
import { ThemeSelector } from "@/modules/theme/presentation/theme-selector";
import { getServerUserId } from "../infrastructure/get-server-user-id";
import { signOutAction } from "./auth-actions";

export async function SessionNavigation() {
  const isAuthenticated = Boolean(await getServerUserId());

  if (isAuthenticated) {
    return (
      <nav aria-label="Navigation principale">
        <Link href="/planifier" prefetch={false}>Planifier</Link>
        <Link href="/dashboard" prefetch={false}>Tableau de bord</Link>
        <Link href="/historique" prefetch={false}>Historique</Link>
        <Link href="/profil" prefetch={false}>Mon profil</Link>
        <Link href="/confidentialite" prefetch={false}>Confidentialité</Link>
        <form action={signOutAction}>
          <button className="nav-button" type="submit">Déconnexion</button>
        </form>
        <ThemeSelector />
      </nav>
    );
  }

  return (
    <nav aria-label="Navigation principale">
      <Link href="/planifier" prefetch={false}>Planifier</Link>
      <Link href="/politique-de-confidentialite" prefetch={false}>Confidentialité</Link>
      <Link href="/connexion" prefetch={false}>Connexion</Link>
      <Link className="button button-small" href="/inscription" prefetch={false}>Créer un compte</Link>
      <ThemeSelector />
    </nav>
  );
}
