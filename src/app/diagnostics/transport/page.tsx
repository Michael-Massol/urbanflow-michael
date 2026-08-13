import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { getServerTransportDiagnostics } from "@/modules/transport/infrastructure/get-server-transport-diagnostics";

export const metadata: Metadata = { title: "Diagnostic transport" };
export const dynamic = "force-dynamic";

const statusLabels = {
  operational: "Opérationnel",
  "configuration-required": "Configuration requise",
  error: "Erreur",
} as const;

function capabilityLabel(capability: { status: "operational" | "error" | "not-applicable"; detail?: string }) {
  if (capability.status === "operational") return "Opérationnel";
  if (capability.status === "not-applicable") return capability.detail ?? "Non applicable";
  return capability.detail ?? "Erreur";
}

export default async function TransportDiagnosticsPage() {
  if (!(await getServerUserId())) redirect("/connexion");
  const diagnostics = await getServerTransportDiagnostics();

  return (
    <section className="page-shell diagnostics-shell">
      <p className="eyebrow">État technique</p>
      <h1>Diagnostic transport</h1>
      <p>Cette page n’affiche aucune clé, aucun jeton et aucun chemin local.</p>
      <dl className="diagnostics-list">
        <div><dt>Fournisseur actif</dt><dd>{diagnostics.provider === "demo" ? "Démonstration" : "Tisséo"}</dd></div>
        <div><dt>Clé API</dt><dd>{diagnostics.keyConfigured ? "Configurée" : "Absente"}</dd></div>
        <div><dt>Notice</dt><dd>{diagnostics.notice}</dd></div>
        <div><dt>Recherche de lieux</dt><dd>{capabilityLabel(diagnostics.places)}</dd></div>
        <div><dt>Calcul d’itinéraires</dt><dd>{capabilityLabel(diagnostics.journeys)}</dd></div>
        <div><dt>Géométrie</dt><dd>{capabilityLabel(diagnostics.geometry)}</dd></div>
        <div><dt>Statut</dt><dd>{statusLabels[diagnostics.status]}</dd></div>
        {diagnostics.checkedAt ? <div><dt>Dernier contrôle</dt><dd>{new Date(diagnostics.checkedAt).toLocaleString("fr-FR")}</dd></div> : null}
      </dl>
    </section>
  );
}
