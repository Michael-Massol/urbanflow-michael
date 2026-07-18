import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUserId } from "@/modules/auth/infrastructure/get-server-user-id";
import { getServerTransportDiagnostics } from "@/modules/transport/infrastructure/get-server-transport-diagnostics";

export const metadata: Metadata = { title: "Diagnostic transport" };
export const dynamic = "force-dynamic";

const statusLabels = {
  operational: "Opérationnel",
  "configuration-required": "Configuration requise",
  "adapter-unavailable": "Adaptateur indisponible",
} as const;

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
        <div><dt>Notice</dt><dd>{diagnostics.notice}</dd></div>
        <div><dt>GTFS local</dt><dd>{diagnostics.gtfsAvailable ? "Disponible" : "Indisponible"}</dd></div>
        <div><dt>Statut</dt><dd>{statusLabels[diagnostics.status]}</dd></div>
      </dl>
    </section>
  );
}
