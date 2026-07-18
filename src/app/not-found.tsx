import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="page-shell error-page">
      <p className="eyebrow">Erreur 404</p>
      <h1>Page introuvable</h1>
      <p>Cette adresse n’existe pas ou n’est plus disponible.</p>
      <Link className="button" href="/">Revenir à l’accueil</Link>
    </section>
  );
}
