import "./globals.css";
import Navbar from "../components/Navbar";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "SoccerverseBase",
  description: "L'outil ultime pour Soccerverse",
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
