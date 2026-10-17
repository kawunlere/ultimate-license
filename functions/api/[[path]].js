export const config = { runtime: "edge" };
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    let deviceId = null;
    const cookieH = request.headers.get("Cookie") || "";
    const cm = cookieH.match(/ult_did=([a-f0-9]{32})/);
    if (cm) deviceId = cm[1];
    const jh = { "content-type": "application/json" };
    const setCookie = (did) => "ult_did=" + did + "; Path=/; Max-Age=31536000; SameSite=Strict";
    const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    if (path === "/api/me") {
      const did = deviceId || await newDevice();
      const r = new Response(JSON.stringify({ deviceId: did }), { headers: jh });
      r.headers.append("Set-Cookie", setCookie(did));
      return r;
    }
    if (path === "/api/free/start" && request.method === "POST") {
      const did = deviceId || await newDevice();
      const token = rand(32);
      await env.KEYS.put("adsess:" + token, JSON.stringify({ deviceId: did, ip, step: 0, created: Date.now() }), { expirationTtl: 3600 });
      const r = new Response(JSON.stringify({ ok: true, deviceId: did, token }), { headers: jh });
      r.headers.append("Set-Cookie", setCookie(did));
      return r;
    }
    if (path === "/api/free/step" && request.method === "POST") {
      const { token, step } = await request.json();
      const raw = await env.KEYS.get("adsess:" + token);
      if (!raw) return j({ ok:false, err:"Session expired" }, 400);
      const s = JSON.parse(raw);
      if (s.ip !== ip) return j({ ok:false, err:"IP mismatch" }, 403);
      if (step !== s.step + 1) return j({ ok:false, err:"Wrong step" }, 400);
      s.step = step;
      await env.KEYS.put("adsess:" + token, JSON.stringify(s), { expirationTtl: 3600 });
      return j({ ok: true, step });
    }
    if (path === "/api/free/claim" && request.method === "POST") {
      const { token } = await request.json();
      const raw = await env.KEYS.get("adsess:" + token);
      if (!raw) return j({ ok:false, err:"Session expired" }, 400);
      const s = JSON.parse(raw);
      if (s.ip !== ip) return j({ ok:false, err:"IP mismatch" }, 403);
      if (s.step < 8) return j({ ok:false, err:"Complete all ads first" }, 400);
      if (Date.now() - s.created > 30 * 60 * 1000) return j({ ok:false, err:"Timed out" }, 400);
      const last = await env.KEYS.get("lastfree:" + s.deviceId);
      if (last && (Date.now() - parseInt(last)) < 2 * 24 * 60 * 60 * 1000) return j({ ok:false, err:"Cooldown active" }, 429);
      const key = "FREE-" + rand(16).toUpperCase();
      const expiry = Date.now() + 2 * 24 * 60 * 60 * 1000;
      await env.KEYS.put("key:" + key, JSON.stringify({ type: "free", deviceId: s.deviceId, ip, expiry, created: Date.now() }));
      await env.KEYS.put("lastfree:" + s.deviceId, String(Date.now()));
      await env.KEYS.delete("adsess:" + token);
      await audit(env, "FREE_KEY", { deviceId: s.deviceId, ip, key });
      return j({ ok: true, key, expiresIn: "2 days" });
    }
    if (path === "/api/verify-key" && request.method === "POST") {
      let body; try { body = await request.json(); } catch { body = {}; }
      const { deviceId: did, key } = body;
      if (!did || !key) return new Response(JSON.stringify({ valid: false }), { headers: jh });
      const raw = await env.KEYS.get("key:" + key);
      if (!raw) return new Response(JSON.stringify({ valid: false }), { headers: jh });
      const k = JSON.parse(raw);
      if (Date.now() > k.expiry) return new Response(JSON.stringify({ valid: false }), { headers: jh });
      if (k.type === "free" && (k.deviceId !== did || k.ip !== ip)) return new Response(JSON.stringify({ valid: false }), { headers: jh });
      await audit(env, "VERIFY", { did, ip, k: key.substring(0, 8), t: k.type });
      return new Response(JSON.stringify({ valid: true, expires: new Date(k.expiry).toISOString(), type: k.type }), { headers: jh });
    }
    if (path === "/api/premium/submit" && request.method === "POST") {
      const b = await request.json();
      const id = "pay:" + Date.now() + "-" + rand(6);
      await env.KEYS.put(id, JSON.stringify({ ...b, status: "pending", created: Date.now() }), { expirationTtl: 7 * 24 * 3600 });
      await audit(env, "PREMIUM_SUBMIT", b);
      return j({ ok: true, msg: "Submission received. Auto-confirm begins, manual fallback available." });
    }
    if (path === "/api/spenda/webhook" && request.method === "POST") {
      const sig = request.headers.get("x-spenda-signature");
      if (sig !== env.SPENDA_WEBHOOK_SECRET) return new Response("Forbidden", { status: 403 });
      const b = await request.json();
      const { deviceId, plan, txHash } = b;
      if (!deviceId || !plan) return j({ ok: false }, 400);
      const days = plan === "30" ? 30 : 14;
      const key = (plan === "30" ? "PREM30-" : "PREM14-") + rand(16).toUpperCase();
      const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
      await env.KEYS.put("key:" + key, JSON.stringify({ type: "premium", deviceId, ip: "*", expiry, created: Date.now() }));
      await env.KEYS.put("idem:" + txHash, key);
      await audit(env, "AUTO_APPROVE", { key, deviceId, plan, txHash });
      return j({ ok: true, key });
    }
    if (path.startsWith("/owner/")) {
      const tok = path.split("/")[2];
      if (tok !== env.OWNER_TOKEN) return new Response("Forbidden", { status: 403 });
      if (path === "/owner/" + tok) return ownerPage(tok);
      if (path === "/owner/" + tok + "/api/issue" && request.method === "POST") {
        const b = await request.json();
        const key = (b.type === "owner" ? "OWN-" : "PREM-") + rand(16).toUpperCase();
        const expiry = Date.now() + (b.days || 14) * 24 * 60 * 60 * 1000;
        await env.KEYS.put("key:" + key, JSON.stringify({ type: b.type, deviceId: b.deviceId || "*", ip: "*", expiry, created: Date.now() }));
        await audit(env, "ISSUE", { key, ...b });
        return j({ ok: true, key });
      }
      if (path === "/owner/" + tok + "/api/list") {
        const list = await env.KEYS.list({ prefix: "key:" });
        const items = [];
        for (const k of list.keys.slice(0, 100)) { const v = await env.KEYS.get(k.name); if (v) items.push({ key: k.name.replace("key:", ""), ...JSON.parse(v) }); }
        return new Response(JSON.stringify(items, null, 2), { headers: jh });
      }
      if (path === "/owner/" + tok + "/api/revoke" && request.method === "POST") {
        await env.KEYS.delete("key:" + (await request.json()).key);
        return j({ ok: true });
      }
      if (path === "/owner/" + tok + "/api/pending") {
        const list = await env.KEYS.list({ prefix: "pay:" });
        const items = [];
        for (const k of list.keys) { const v = await env.KEYS.get(k.name); if (v) items.push({ id: k.name, ...JSON.parse(v) }); }
        return new Response(JSON.stringify(items, null, 2), { headers: jh });
      }
      if (path === "/owner/" + tok + "/api/approve" && request.method === "POST") {
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
    }
    return new Response("Not Found", { status: 404 });
  }
};
function j(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { "content-type": "application/json" } }); }
function rand(n) { const c = "abcdefghijklmnopqrstuvwxyz0123456789"; let s = ""; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
async function newDevice() { const a = new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32); }
async function audit(env, t, d) { await env.KEYS.put("audit:" + Date.now() + "-" + rand(4), JSON.stringify({ type: t, ...d, ts: Date.now() }), { expirationTtl: 30 * 24 * 3600 }); }
function ownerPage(tok) {
  return new Response(`<!doctype html><html><head><title>Owner</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;background:#0d1117;color:#e6edf3;margin:0;padding:24px;font-size:13px}.c{max-width:560px;margin:0 auto}.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px;margin-bottom:14px}h2{color:#d4af37;font-size:18px;margin:0 0 14px}input,select{width:100%;padding:10px;background:#000;border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:8px;margin-bottom:8px;font-size:13px}button{padding:10px 18px;background:linear-gradient(135deg,#d4af37,#b8941f);color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-right:6px}pre{background:#000;padding:12px;border-radius:8px;font-size:11px;overflow:auto;max-height:300px;color:#00d4ff;white-space:pre-wrap}</style></head><body><div class="c"><h2>Owner Control</h2><div class="card"><h2 style="font-size:14px">Manual Issue</h2><input id="d" placeholder="Device ID"><select id="t"><option value="premium">Premium</option><option value="owner">Owner</option></select><input id="days" type="number" value="14"><button onclick="issue()">Generate</button><pre id="o"></pre></div><div class="card"><h2 style="font-size:14px">Pending Payments</h2><button onclick="load('pending')">Load</button><pre id="p"></pre></div><div class="card"><h2 style="font-size:14px">Active Keys</h2><button onclick="load('list')">Load</button><pre id="l"></pre></div></div><script>async function issue(){const r=await fetch('/owner/${tok}/api/issue',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({deviceId:d.value,type:t.value,days:parseInt(days.value)})});o.textContent=(await r.json()).key||'';}async function load(t){const r=await fetch('/owner/${tok}/api/'+t);document.getElementById(t==='pending'?'p':'l').textContent=await r.text();}</script></body></html>`, { headers: { "content-type": "text/html" } });
}
