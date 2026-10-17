import { j, rand, newDevice, getDeviceId, corsHeaders } from "../../_shared.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  let did = getDeviceId(request);
  if (!did) did = await newDevice();
  const token = rand(32);
  await env.KEYS.put("adsess:" + token, JSON.stringify({ deviceId: did, ip, step: 0, created: Date.now() }), { expirationTtl: 3600 });
  const r = j({ ok: true, deviceId: did, token });
  r.headers.append("Set-Cookie", "ult_did=" + did + "; Path=/; Max-Age=31536000; SameSite=Strict");
  return r;
}
