import { j, rand, audit } from "../../../_shared.js";
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const token = url.pathname.split("/")[2];
  if (token !== env.OWNER_TOKEN) return new Response("Forbidden", { status: 403 });
  const b = await request.json();
  const pay = await env.KEYS.get(b.id);
  if (!pay) return j({ ok: false }, 404);
  const p = JSON.parse(pay);
  const days = b.days || (p.plan === "30" ? 30 : 14);
  const key = (p.plan === "30" ? "PREM30-" : "PREM14-") + rand(16).toUpperCase();
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  await env.KEYS.put("key:" + key, JSON.stringify({ type: "premium", deviceId: p.deviceId, ip: "*", expiry, created: Date.now() }));
  await env.KEYS.delete(b.id);
  await audit(env, "MANUAL_APPROVE", { key, ...p });
  return j({ ok: true, key });
}
