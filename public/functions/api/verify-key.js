import { j, audit, corsHeaders } from "../_shared.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  let body; try { body = await request.json(); } catch { body = {}; }
  const { deviceId: did, key } = body;
  if (!did || !key) return j({ valid: false }, 400);
  const raw = await env.KEYS.get("key:" + key);
  if (!raw) return j({ valid: false });
  const k = JSON.parse(raw);
  if (Date.now() > k.expiry) return j({ valid: false });
  if (k.type === "free" && (k.deviceId !== did || k.ip !== ip)) return j({ valid: false });
  await audit(env, "VERIFY", { did, ip, k: key.substring(0, 8), t: k.type });
  return j({ valid: true, expires: new Date(k.expiry).toISOString(), type: k.type });
}
