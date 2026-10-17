export function j(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS"
    }
  });
}
export function rand(n) {
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}
export async function newDevice() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}
export async function audit(env, t, d) {
  await env.KEYS.put("audit:" + Date.now() + "-" + rand(4), JSON.stringify({ type: t, ...d, ts: Date.now() }), { expirationTtl: 30 * 24 * 3600 });
}
export function getDeviceId(request) {
  const cookieH = request.headers.get("Cookie") || "";
  const m = cookieH.match(/ult_did=([a-f0-9]{32})/);
  return m ? m[1] : null;
}
export function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS"
  };
}
