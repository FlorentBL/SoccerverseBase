// Next.js API route to proxy Soccerverse player history endpoint
export async function GET(req, { params }) {
  const { id } = params;
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({ error: "player id required" }), { status: 400 });
  }
  const apiUrl = `https://services.soccerverse.com/api/player/history?player_id=${id}`;
  try {
    const resp = await fetch(apiUrl, { cache: "no-store" });
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: "Soccerverse API: " + resp.status }),
        { status: resp.status }
      );
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
