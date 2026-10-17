import { j, rand, audit, corsHeaders } from "../../_shared.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  if (request.method !== "POST") return j({ ok: false, err: "POST only" }, 405);
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  let body; try { body = await request.json(); } catch { return j({ ok: false, err: "Bad JSON" }, 400); }
  const { token } = body;
  const raw = await env.KEYS.get("adsess:" + token);
  if (!raw) return j({ ok: false, err: "Session expired" }, 400);
  const s = JSON.parse(raw);
  if (s.ip !== ip) return j({ ok: false, err: "IP mismatch" }, 403);
  if (s.step < 8) return j({ ok: false, err: "Complete all ads first" }, 400);
  if (Date.now() - s.created > 30 * 60 * 1000) return j({ ok: false, err: "Timed out" }, 400);
  const last = await env.KEYS.get("lastfree:" + s.deviceId);
  if (last && (Date.now() - parseInt(last)) < 2 * 24 * 60 * 60 * 1000) return j({ ok: false, err: "Cooldown active" }, 429);
  const key = "FREE-" + rand(16).toUpperCase();
  const expiry = Date.now() + 2 * 24 * 60 * 60 * 1000;
  await env.KEYS.put("key:" + key, JSON.stringify({ type: "free", deviceId: s.deviceId, ip, expiry, created: Date.now() }));
  await env.KEYS.put("lastfree:" + s.deviceId, String(Date.now()));
  await env.KEYS.delete("adsess:" + token);
  await audit(env, "FREE_KEY", { deviceId: s.deviceId, ip, key });
  return j({ ok: true, key, expiresIn: "2 days" });
}
