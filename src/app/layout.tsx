import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SessionNavigation } from "@/modules/auth/presentation/session-navigation";
import { ServiceWorkerRegistration } from "@/modules/pwa/presentation/service-worker-registration";
import { THEME_INITIALIZATION_SCRIPT } from "@/modules/theme/presentation/theme-initialization";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UrbanFlow Mobility", template: "%s | UrbanFlow" },
  description: "Mobilité urbaine intelligente et durable à Toulouse.",
  applicationName: "UrbanFlow Mobility",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b6b53",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          id="urbanflow-theme-initialization"
          dangerouslySetInnerHTML={{ __html: THEME_INITIALIZATION_SCRIPT }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        <header className="site-header">
          <Link className="brand" href="/" prefetch={false} aria-label="UrbanFlow Mobility — Accueil">
            <span aria-hidden="true" className="brand-mark">UF</span>
            <span>UrbanFlow</span>
          </Link>
          <SessionNavigation />
        </header>
        <main id="main-content" tabIndex={-1}>{children}</main>
        <footer className="site-footer">
          <p>UrbanFlow Mobility — Prototype étudiant de mobilité durable.</p>
          <Link href="/politique-de-confidentialite" prefetch={false}>Politique de confidentialité</Link>
        </footer>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
