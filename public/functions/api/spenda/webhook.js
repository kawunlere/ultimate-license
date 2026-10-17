import { j, rand, audit, corsHeaders } from "../../../_shared.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  const sig = request.headers.get("x-spenda-signature");
  if (sig !== env.SPENDA_WEBHOOK_SECRET) return new Response("Forbidden", { status: 403 });
  if (request.method !== "POST") return j({ ok: false }, 405);
  let b; try { b = await request.json(); } catch { return j({ ok: false }, 400); }
  const { deviceId, plan, txHash } = b;
  if (!deviceId || !plan) return j({ ok: false }, 400);
  const days = plan === "30" ? 30 : 14;
  const key = (plan === "30" ? "PREM30-" : "PREM14-") + rand(16).toUpperCase();
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  await env.KEYS.put("key:" + key, JSON.stringify({ type: "premium", deviceId, ip: "*", expiry, created: Date.now() }));
  await audit(env, "AUTO_APPROVE", { key, deviceId, plan, txHash });
  return j({ ok: true, key });
}
