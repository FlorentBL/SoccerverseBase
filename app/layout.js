import "./globals.css";
import Navbar from "../components/Navbar";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://soccerversebase.com"
  ),
  title: "SoccerverseBase",
  description: "L'outil ultime pour Soccerverse",
  keywords: [
    "soccerverse",
    "football",
    "stats",
    "analytics",
    "outil",
  ],
  openGraph: {
    title: "SoccerverseBase",
    description: "L'outil ultime pour Soccerverse",
    siteName: "SoccerverseBase",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "SoccerverseBase logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SoccerverseBase",
    description: "L'outil ultime pour Soccerverse",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/fr",
      "en-US": "/en",
      "es-ES": "/es",
      "it-IT": "/it",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="font-sans min-h-screen antialiased">
        <Navbar />
        <main className="pt-24 px-4 md:px-8">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
