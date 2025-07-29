// app/layout.js ou app/layout.jsx
import "./globals.css";
import Navbar from "../components/Navbar"; // adapte le chemin si besoin

export const metadata = {
  title: "SoccerverseBase",
  description: "L'outil ultime pour Soccerverse",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <div style={{ paddingTop: 60 }}> {/* pour compenser la navbar fixed */}
          {children}
        </div>
      </body>
    </html>
  );
}
