// Next.js 13+ (app router)
// Permet de proxy l'API Soccerverse depuis le backend Next.js

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const club_id = searchParams.get("club_id");
  const season_id = searchParams.get("season_id");

  // Sécurité : vérifier que club_id et season_id sont valides (entiers)
  if (!club_id || !season_id || isNaN(club_id) || isNaN(season_id)) {
    return new Response(JSON.stringify({ error: "club_id et season_id requis" }), { status: 400 });
  }

  // Appel API Soccerverse
  const apiUrl = `https://services.soccerverse.com/api/club_balance_sheet/weeks?club_id=${club_id}&season_id=${season_id}`;

  try {
    const resp = await fetch(apiUrl, { cache: "no-store" });
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "API Soccerverse : " + resp.status }), { status: resp.status });
    }
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
