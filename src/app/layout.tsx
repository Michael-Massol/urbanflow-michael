import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SessionNavigation } from "@/modules/auth/presentation/session-navigation";
import { ServiceWorkerRegistration } from "@/modules/pwa/presentation/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UrbanFlow Mobility", template: "%s | UrbanFlow" },
  description: "Mobilité urbaine intelligente et durable à Toulouse.",
  applicationName: "UrbanFlow Mobility",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b6b53",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="UrbanFlow Mobility — Accueil">
            <span aria-hidden="true" className="brand-mark">UF</span>
            <span>UrbanFlow</span>
          </Link>
          <SessionNavigation />
        </header>
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <p>UrbanFlow Mobility — Prototype étudiant de mobilité durable.</p>
        </footer>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
