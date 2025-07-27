// app/layout.js
import "./globals.css";

export const metadata = {
  title: "SoccerverseBase",
  description: "Outils et statistiques pour dominer le Soccerverse",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
