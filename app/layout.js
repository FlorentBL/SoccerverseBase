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
      <body className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white min-h-screen relative">
        <Navbar />
        <img
          src="/logo.png"
          alt="SoccerverseBase logo"
          className="fixed right-6 top-16 w-28 md:w-40 opacity-20 pointer-events-none select-none hidden md:block z-0"
        />
        <div className="relative z-10" style={{ paddingTop: 60 }}>
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
