import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPolicyPage() {
  const contact = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim();

  return (
    <article className="page-shell legal-page">
      <p className="eyebrow">Information RGPD</p>
      <h1>Politique de confidentialité</h1>
      <p className="field-hint">Version 1.0 — applicable au 18 juillet 2026</p>

      <h2>Responsable et finalités</h2>
      <p>
        UrbanFlow Mobility est un prototype étudiant. Il utilise un compte pour personnaliser les préférences
        de déplacement, proposer des itinéraires et conserver uniquement les trajets confirmés afin de produire
        un historique et un résumé carbone.
      </p>

      <h2>Données traitées</h2>
      <ul>
        <li>adresse e-mail et identifiant technique du compte ;</li>
        <li>nom affiché et préférences de mobilité ;</li>
        <li>trajets explicitement confirmés : libellés publics, horaires, durée, distance, modes, estimations carbone et tracé cartographique normalisé lorsqu’il est disponible.</li>
      </ul>
      <p>
        Les recherches non confirmées, la position précise fournie par le navigateur, les mots de passe, les réponses brutes Tisséo et
        les données d’autres utilisateurs ne sont pas intégrés à l’historique.
      </p>

      <h2>Géolocalisation</h2>
      <p>
        Le navigateur demande un consentement explicite avant tout accès à la position. Elle sert uniquement
        à préparer la recherche en cours, n’est pas stockée dans Supabase et n’est pas incluse dans l’export.
        Le refus n’empêche pas la saisie manuelle d’un lieu.
      </p>
      <p>
        Pour un trajet explicitement confirmé, UrbanFlow conserve uniquement une ligne cartographique normalisée
        afin de restituer le trajet dans l’historique sans rappeler Tisséo. Ce tracé est inclus dans l’export et
        supprimé avec le trajet ou le compte.
      </p>

      <h2>Base, destinataires et conservation</h2>
      <p>
        Les traitements nécessaires au compte et aux services demandés reposent sur l’exécution du service
        sollicité par l’utilisateur. Supabase héberge l’authentification et les données. Les lignes sont isolées
        par des politiques RLS. Les données restent conservées jusqu’à leur suppression par l’utilisateur ou
        jusqu’à la suppression du compte.
      </p>

      <h2>Vos droits</h2>
      <p>
        Une fois connecté, vous pouvez rectifier le profil, supprimer chaque trajet, exporter vos données en JSON
        et supprimer définitivement le compte depuis la page Confidentialité.
      </p>
      {contact ? (
        <p>Pour toute question relative aux données : <a href={`mailto:${contact}`}>{contact}</a>.</p>
      ) : (
        <p className="notice-warning">
          Le responsable du déploiement doit renseigner l’adresse de contact RGPD avant publication publique.
        </p>
      )}

      <h2>Limites du prototype</h2>
      <p>
        Les itinéraires en mode démonstration ne sont pas des données temps réel. Les facteurs carbone sont des
        moyennes documentées et ne constituent pas un bilan de cycle de vie personnalisé.
      </p>
      <Link className="button" href="/confidentialite">Gérer mes données</Link>
    </article>
  );
}
