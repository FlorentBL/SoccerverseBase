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
      <body className="font-sans min-h-screen antialiased relative">
        <img
          src="/logo.png"
          alt="SoccerverseBase logo"
          className="fixed right-6 top-10 w-28 md:w-40 opacity-20 pointer-events-none select-none hidden md:block"
        />
        <Navbar />
        <main className="pt-24 px-4 md:px-8">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
