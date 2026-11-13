import { getStore } from "@netlify/blobs";

const KEYS = ["sweet", "fun", "hot"];

export default async (req) => {
  const store = getStore("wheel");

  if (req.method === "GET") {
    const data = (await store.get("data", { type: "json" })) || {};
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return new Response("bad request", { status: 400 }); }
    const pass = Netlify.env.get("ADMIN_PASSWORD");
    if (!pass || body.password !== pass) return new Response("unauthorized", { status: 401 });
    if (body.action === "check") return Response.json({ ok: true });

    const d = body.data;
    if (!d || typeof d !== "object") return new Response("bad data", { status: 400 });
    const clean = {};
    for (const k of KEYS) {
      if (!Array.isArray(d[k]) || d[k].length < 3 || d[k].length > 12) continue;
      clean[k] = d[k].map((x) => ({
        t: String(x.t || "").slice(0, 60),
        e: String(x.e || "").slice(0, 8),
        img: typeof x.img === "string" && x.img.startsWith("data:image/") && x.img.length < 600000 ? x.img : null,
      }));
    }
    if (d.names && typeof d.names === "object") {
      clean.names = {};
      for (const k of KEYS) {
        if (typeof d.names[k] === "string" && d.names[k].trim()) clean.names[k] = d.names[k].trim().slice(0, 30);
      }
    }
    await store.setJSON("data", clean);
    return Response.json({ ok: true });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/wheel" };
