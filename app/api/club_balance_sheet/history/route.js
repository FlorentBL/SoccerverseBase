// Next.js 13+ (app router)
// Agrège les historiques des bilans hebdomadaires pour plusieurs saisons

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const club_id = searchParams.get("club_id");
  const seasonsParam = searchParams.get("seasons") || "3";
  const seasons = parseInt(seasonsParam, 10);

  if (!club_id || isNaN(club_id)) {
    return new Response(JSON.stringify({ error: "club_id requis" }), { status: 400 });
  }
  if (isNaN(seasons) || seasons <= 0) {
    return new Response(JSON.stringify({ error: "paramètre seasons invalide" }), { status: 400 });
  }

  const baseUrl = "https://services.soccerverse.com/api/club_balance_sheet/weeks";

  try {
    const seasonIds = Array.from({ length: seasons }, (_, i) => i + 1);
    const data = await Promise.all(seasonIds.map(async (season_id) => {
      const url = `${baseUrl}?club_id=${club_id}&season_id=${season_id}`;
      const resp = await fetch(url, { cache: "no-store" });
      if (!resp.ok) {
        throw new Error(`API Soccerverse : ${resp.status}`);
      }
      const weeks = await resp.json();
      return { season_id, weeks };
    }));

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
