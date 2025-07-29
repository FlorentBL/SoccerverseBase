import "./globals.css";
import Navbar from "../components/Navbar"; // adapte le chemin si besoin
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: "SoccerverseBase",
  description: "L'outil ultime pour Soccerverse",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        {/* Mets ici d'autres balises meta si besoin */}
      </head>
      <body>
        <Navbar />
        <div style={{ paddingTop: 60 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
