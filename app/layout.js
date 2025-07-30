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
      <body>
        <Navbar />
        <div style={{ paddingTop: 60 }}>
          {children}
        </div>
        <Analytics /> {/* <-- Ajoute cette ligne ici */}
      </body>
    </html>
  );
}
