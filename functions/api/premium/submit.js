import { j, rand, audit, corsHeaders } from "../../../_shared.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  if (request.method !== "POST") return j({ ok: false }, 405);
  let b; try { b = await request.json(); } catch { return j({ ok: false }, 400); }
  const id = "pay:" + Date.now() + "-" + rand(6);
  await env.KEYS.put(id, JSON.stringify({ ...b, status: "pending", created: Date.now() }), { expirationTtl: 7 * 24 * 3600 });
  await audit(env, "PREMIUM_SUBMIT", b);
  return j({ ok: true, msg: "Submission received. Manual fallback review within 12 hours." });
}
