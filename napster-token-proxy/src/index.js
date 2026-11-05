const ALLOWED_ORIGINS = [
  "https://dlvalentine.github.io",
  "http://localhost:5173",
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowed = ALLOWED_ORIGINS.includes(origin);

    const cors = {
      "Access-Control-Allow-Origin": allowed ? origin : "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    if (request.method !== "POST" || !allowed) {
      return new Response("Forbidden", { status: 403 });
    }

    const res = await fetch(
      `https://companion-api.napster.com/public/agents/${env.AGENT_ID}/connections`,
      {
        method: "POST",
        headers: {
          "X-Api-Key": env.NAPSTER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelType: "webrtc" }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return new Response(
        JSON.stringify({ error: "upstream_error", status: res.status, body }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify({ token: data.token }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};