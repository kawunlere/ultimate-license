// =====================================================
// Ultimate License Worker — single file, no imports
// =====================================================

function j(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS", ...extra }
  });
}
function rand(n) { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<n;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }
async function newDevice() { return "dev_" + rand(6) + "_" + Date.now().toString(36); }
async function getDeviceId(request) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/ult_did=([^;]+)/);
  if (m) return m[1];
  return null;
}
async function audit(env, event, data) {
  try {
    if (!env.KEYS) return;
    const key = "audit:" + Date.now() + ":" + rand(4);
    await env.KEYS.put(key, JSON.stringify({ event, ...data, t: Date.now() }), { expirationTtl: 60 * 60 * 24 * 30 });
  } catch (e) {}
}
function setDeviceCookie(headers, deviceId) {
  headers.append("set-cookie", `ult_did=${deviceId}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
  return headers;
}

function ownerPage(env, token) {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Owner Panel — Ultimate License</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<style>
.owner-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-bottom:14px; }
.owner-grid label { display:flex; flex-direction:column; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#9aa3b2; }
.owner-grid input, .owner-grid select {
  margin-top:4px; padding:9px 11px; border-radius:8px;
  background:rgba(255,255,255,0.04); border:1px solid rgba(212,175,55,0.18);
  color:#e8eaed; font-family:inherit; font-size:13px; outline:none;
}
.owner-grid input:focus, .owner-grid select:focus { border-color:rgba(0,212,255,0.55); box-shadow:0 0 0 3px rgba(0,212,255,0.08); }
.row-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
.output {
  background:rgba(0,0,0,0.35); border:1px solid rgba(212,175,55,0.14);
  border-radius:10px; padding:14px; color:#cfd6e2; font-size:11.5px;
  font-family:'SF Mono','Menlo','Consolas',monospace; line-height:1.55;
  white-space:pre-wrap; word-break:break-all; max-height:340px; overflow:auto;
}
.kbd { display:inline-block; padding:1px 6px; border-radius:4px; background:rgba(212,175,55,0.12); color:#d4af37; font-size:10.5px; font-family:monospace; }
.stat-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:10px; margin-bottom:18px; }
.stat { padding:14px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(212,175,55,0.12); }
.stat .num { font-size:24px; font-weight:600; color:#d4af37; letter-spacing:-0.02em; }
.stat .lbl { font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:#9aa3b2; margin-top:3px; }
</style>
</head><body>
<div class="container">
<div class="brand">
  <div class="brand-mark">UL</div>
  <div>
    <div class="brand-title">Ultimate License</div>
    <div class="brand-sub">Owner Control Panel</div>
  </div>
</div>

<div class="stat-grid" id="stats">
  <div class="stat"><div class="num" id="statTotal">—</div><div class="lbl">Active Keys</div></div>
  <div class="stat"><div class="num" id="statFree">—</div><div class="lbl">Free Trials</div></div>
  <div class="stat"><div class="num" id="statPrem">—</div><div class="lbl">Premium</div></div>
  <div class="stat"><div class="num" id="statPending">—</div><div class="lbl">Pending</div></div>
</div>

<section class="card">
  <div class="card-head">
    <h2 class="section">Issue Keys</h2>
    <span class="pill">Generate</span>
  </div>
  <form id="issueForm">
    <div class="owner-grid">
      <label>Type
        <select name="type" id="type">
          <option value="free">Free Trial · 2 days</option>
          <option value="premium_2w">Premium · $3 · 2 weeks</option>
          <option value="premium_1m">Premium · $5 · 1 month</option>
        </select>
      </label>
      <label>Plan
        <select name="plan" id="plan">
          <option value="single">Single key</option>
          <option value="bulk">Bulk</option>
        </select>
      </label>
      <label>Count
        <input type="number" name="count" id="count" value="1" min="1" max="500">
      </label>
      <label>Note
        <input type="text" name="note" placeholder="optional">
      </label>
    </div>
    <div class="row-actions">
      <button class="btn primary" type="submit">Generate Keys</button>
      <button class="btn ghost" type="button" id="copyBtn" disabled>Copy Last</button>
    </div>
  </form>
  <div class="output" id="issued" style="margin-top:14px;">Output will appear here.</div>
</section>

<section class="card">
  <div class="card-head">
    <h2 class="section">Pending Premium Approvals</h2>
    <button class="btn ghost" type="button" id="loadPending">Refresh</button>
  </div>
  <div class="output" id="pending">Click Refresh to load pending requests.</div>
</section>

<section class="card">
  <div class="card-head">
    <h2 class="section">All Active Keys</h2>
    <button class="btn ghost" type="button" id="loadAll">Refresh</button>
  </div>
  <div class="output" id="allkeys">Click Refresh to list all keys.</div>
</section>

<div class="footer-note">
  <span class="kbd">/owner/&lt;token&gt;</span> · keep this URL private. Anyone with it controls keys.
</div>
</div>

<script>
const TOKEN = ${JSON.stringify(token)};
const API = (sub) => "/owner/" + TOKEN + "/api/" + sub;

async function api(sub, body) {
  const r = await fetch(API(sub), { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : "{}" });
  return r.json();
}

function fmt(v) { if (v === undefined || v === null) return "—"; return v; }

function renderStats(all, pending) {
  const total = all.length;
  const free = all.filter(k => k.type === "free").length;
  const prem = all.filter(k => (k.type || "").startsWith("premium")).length;
  document.getElementById("statTotal").textContent = fmt(total);
  document.getElementById("statFree").textContent = fmt(free);
  document.getElementById("statPrem").textContent = fmt(prem);
  document.getElementById("statPending").textContent = fmt(pending.length);
}

async function refreshAll() {
  const [allRes, pendRes] = await Promise.all([api("list", {}), api("pending", {})]);
  const all = allRes.keys || [];
  const pending = pendRes.pending || [];
  renderStats(all, pending);
  document.getElementById("allkeys").textContent = JSON.stringify(all, null, 2);
  document.getElementById("pending").textContent = JSON.stringify(pending, null, 2);
}

document.getElementById("issueForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const plan = f.get("plan");
  const data = { type: f.get("type"), note: f.get("note") || "" };
  if (plan === "bulk") data.count = parseInt(f.get("count") || "1", 10);
  const res = await api("issue", data);
  document.getElementById("issued").textContent = JSON.stringify(res, null, 2);
  const btn = document.getElementById("copyBtn");
  btn.disabled = !(res.generated && res.generated.length);
  btn.dataset.last = JSON.stringify(res.generated || []);
  refreshAll();
});

document.getElementById("copyBtn").onclick = async () => {
  const data = JSON.parse(document.getElementById("copyBtn").dataset.last || "[]");
  const txt = data.map(k => k.key).join("\\n");
  try { await navigator.clipboard.writeText(txt); } catch (e) {}
};

document.getElementById("loadPending").onclick = () => refreshAll();
document.getElementById("loadAll").onclick = () => refreshAll();
refreshAll();
</script>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": "*" } });
}

// Strip trailing slash, then resolve a static path to its .html file
function resolveStatic(path) {
  let p = path;
  while (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (p === "" || p === "/") return "/index.html";
  const known = {
    "/index": "/index.html",
    "/free": "/free.html",
    "/premium": "/premium.html",
    "/donate": "/donate.html",
    "/style": "/style.css"
  };
  if (known[p]) return known[p];
  if (p === "/index.html" || p === "/free.html" || p === "/premium.html" || p === "/donate.html" || p === "/style.css") return p;
  return null;
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const ownerToken = env.OWNER_TOKEN || "";

  // ====== Owner routes ======
  const ownerBase = `/owner/${ownerToken}`;
  if (path === ownerBase || path === ownerBase + "/") return ownerPage(env, ownerToken);
  if (path.startsWith(ownerBase + "/api/")) {
    const sub = path.substring((ownerBase + "/api/").length);
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    if (sub === "issue") {
      const type = body.type || "free";
      const note = body.note || "";
      const count = Math.max(1, Math.min(500, parseInt(body.count || "1", 10)));
      const ttlDays = type === "free" ? 2 : (type === "premium_2w" ? 14 : 30);
      const brand = type === "free" ? "FREE" : "PREM";
      const out = [];
      for (let i = 0; i < count; i++) {
        const key = `ULT-${brand}-${rand(4)}-${rand(4)}-${rand(4)}`;
        const payload = { key, type, note, created: Date.now(), expires: Date.now() + ttlDays * 86400 * 1000, status: "active", used: false };
        try { if (env.KEYS) await env.KEYS.put("key:" + key, JSON.stringify(payload), { expirationTtl: ttlDays * 86400 + 86400 }); } catch (e) {}
        out.push(payload);
      }
      return j({ ok: true, generated: out });
    }
    if (sub === "list") {
      try {
        if (!env.KEYS) return j({ ok: false, error: "no_kv" });
        const list = await env.KEYS.list({ prefix: "key:" });
        const keys = [];
        for (const k of list.keys) {
          const v = await env.KEYS.get(k.name);
          if (v) keys.push(JSON.parse(v));
        }
        return j({ ok: true, count: keys.length, keys });
      } catch (e) { return j({ ok: false, error: String(e) }); }
    }
    if (sub === "pending") {
      try {
        if (!env.KEYS) return j({ ok: false, error: "no_kv" });
        const list = await env.KEYS.list({ prefix: "prem_req:" });
        const pending = [];
        for (const k of list.keys) {
          const v = await env.KEYS.get(k.name);
          if (v) pending.push(JSON.parse(v));
        }
        return j({ ok: true, count: pending.length, pending });
      } catch (e) { return j({ ok: false, error: String(e) }); }
    }
    if (sub === "approve") {
      const reqId = body.reqId;
      const ttlDays = body.type === "premium_2w" ? 14 : 30;
      const newKey = `ULT-PREM-${rand(4)}-${rand(4)}-${rand(4)}`;
      const payload = { key: newKey, type: body.type || "premium_1m", note: "manual approve", created: Date.now(), expires: Date.now() + ttlDays * 86400 * 1000, status: "active", used: false };
      try { if (env.KEYS) await env.KEYS.put("key:" + newKey, JSON.stringify(payload), { expirationTtl: ttlDays * 86400 + 86400 }); } catch (e) {}
      if (reqId && env.KEYS) await env.KEYS.delete("prem_req:" + reqId);
      return j({ ok: true, key: newKey, expires: payload.expires });
    }
  }

  // ====== Public API ======
  if (path === "/api/me") {
    let did = await getDeviceId(request);
    if (!did) did = await newDevice();
    const headers = new Headers({ "content-type": "application/json", "access-control-allow-origin": "*" });
    setDeviceCookie(headers, did);
    return new Response(JSON.stringify({ deviceId: did, ip, ts: Date.now() }), { status: 200, headers });
  }

  if (path === "/api/free/start") {
    let did = await getDeviceId(request);
    if (!did) did = await newDevice();
    const id = "fs_" + rand(8);
    const headers = new Headers({ "content-type": "application/json", "access-control-allow-origin": "*" });
    setDeviceCookie(headers, did);
    if (env.KEYS) {
      try { await env.KEYS.put("fstep:" + id, JSON.stringify({ deviceId: did, ip, step: 0, started: Date.now() }), { expirationTtl: 60 * 60 * 24 }); } catch (e) {}
    }
    await audit(env, "free_start", { deviceId: did, ip });
    return new Response(JSON.stringify({ ok: true, flowId: id, total: 8, deviceId: did }), { status: 200, headers });
  }

  if (path === "/api/free/step") {
    const body = await request.json().catch(() => ({}));
    const flowId = body.flowId, step = parseInt(body.step || "0", 10);
    let did = await getDeviceId(request);
    if (!did) did = await newDevice();
    if (!env.KEYS) return j({ ok: false, error: "no KV" });
    const raw = await env.KEYS.get("fstep:" + flowId);
    if (!raw) return j({ ok: false, error: "flow_expired" });
    const data = JSON.parse(raw);
    if (data.deviceId !== did) return j({ ok: false, error: "device_mismatch" });
    if (data.step + 1 !== step) return j({ ok: false, error: "out_of_order", expected: data.step + 1 });
    data.step = step;
    await env.KEYS.put("fstep:" + flowId, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 });
    const headers = new Headers({ "content-type": "application/json", "access-control-allow-origin": "*" });
    setDeviceCookie(headers, did);
    return new Response(JSON.stringify({ ok: true, step, complete: step >= 8 }), { status: 200, headers });
  }

  if (path === "/api/free/claim") {
    let did = await getDeviceId(request);
    if (!did) did = await newDevice();
    const body = await request.json().catch(() => ({}));
    const flowId = body.flowId;
    if (!env.KEYS) return j({ ok: false, error: "no_kv" });
    const raw = await env.KEYS.get("fstep:" + flowId);
    if (!raw) return j({ ok: false, error: "flow_expired" });
    const data = JSON.parse(raw);
    if (data.deviceId !== did) return j({ ok: false, error: "device_mismatch" });
    if (data.step < 8) return j({ ok: false, error: "chain_incomplete" });
    const key = `ULT-FREE-${rand(4)}-${rand(4)}-${rand(4)}`;
    const payload = { key, type: "free", deviceId: did, ip, created: Date.now(), expires: Date.now() + 2 * 86400 * 1000, status: "active", used: false };
    try { await env.KEYS.put("key:" + key, JSON.stringify(payload), { expirationTtl: 3 * 86400 }); } catch (e) {}
    await env.KEYS.delete("fstep:" + flowId);
    await audit(env, "free_claim", { deviceId: did, ip, key });
    const headers = new Headers({ "content-type": "application/json", "access-control-allow-origin": "*" });
    setDeviceCookie(headers, did);
    return new Response(JSON.stringify({ ok: true, key, expires: payload.expires, type: "free" }), { status: 200, headers });
  }

  if (path === "/api/verify-key") {
    const body = await request.json().catch(() => ({}));
    const key = (body.key || "").trim().toUpperCase();
    if (!key) return j({ ok: false, valid: false, reason: "no_key" });
    if (!env.KEYS) return j({ ok: false, valid: false, reason: "no_kv" });
    const raw = await env.KEYS.get("key:" + key);
    if (!raw) return j({ ok: false, valid: false, reason: "unknown" });
    const data = JSON.parse(raw);
    if (data.status !== "active") return j({ ok: false, valid: false, reason: "revoked" });
    if (data.expires < Date.now()) return j({ ok: false, valid: false, reason: "expired" });
    if (data.type === "free") {
      let did = await getDeviceId(request);
      if (!did) did = await newDevice();
      if (data.deviceId && data.deviceId !== did) return j({ ok: false, valid: false, reason: "device_locked" });
      if (data.ip && data.ip !== ip && !data.lastIps?.includes(ip)) {
        data.lastIps = data.lastIps || []; data.lastIps.push(ip);
        try { await env.KEYS.put("key:" + key, JSON.stringify(data), { expirationTtl: 3 * 86400 }); } catch (e) {}
      }
      if (!data.used) { data.used = true; try { await env.KEYS.put("key:" + key, JSON.stringify(data), { expirationTtl: 3 * 86400 }); } catch (e) {} }
      const headers = new Headers({ "content-type": "application/json", "access-control-allow-origin": "*" });
      setDeviceCookie(headers, did);
      return new Response(JSON.stringify({ ok: true, valid: true, type: "free", tier: "trial", expires: data.expires }), { status: 200, headers });
    }
    if (data.type.startsWith("premium")) {
      const tier = data.type === "premium_2w" ? "premium_2w" : "premium_1m";
      const headers = new Headers({ "content-type": "application/json", "access-control-allow-origin": "*" });
      let did = await getDeviceId(request);
      if (!did) did = await newDevice();
      setDeviceCookie(headers, did);
      return new Response(JSON.stringify({ ok: true, valid: true, type: "premium", tier, expires: data.expires }), { status: 200, headers });
    }
    return j({ ok: false, valid: false, reason: "unknown_type" });
  }

  if (path === "/api/premium/submit") {
    const body = await request.json().catch(() => ({}));
    const { plan, txHash, network, address } = body;
    let did = await getDeviceId(request);
    if (!did) did = await newDevice();
    if (!plan || !["premium_2w", "premium_1m"].includes(plan)) return j({ ok: false, error: "bad_plan" });
    if (!txHash || txHash.length < 10) return j({ ok: false, error: "bad_hash" });
    if (!env.KEYS) return j({ ok: false, error: "no_kv" });
    const reqId = "pr_" + rand(8);
    const payload = { reqId, plan, txHash: txHash.toLowerCase(), network: network || "unknown", address: address || "", deviceId: did, ip, ts: Date.now(), status: "pending" };
    try { await env.KEYS.put("prem_req:" + reqId, JSON.stringify(payload), { expirationTtl: 60 * 60 * 24 * 14 }); } catch (e) {}
    await audit(env, "premium_submit", { deviceId: did, ip, reqId });
    const headers = new Headers({ "content-type": "application/json", "access-control-allow-origin": "*" });
    setDeviceCookie(headers, did);
    return new Response(JSON.stringify({ ok: true, reqId, status: "pending", auto_confirm: false, message: "Awaiting owner approval (typically under 30 min)" }), { status: 200, headers });
  }

  if (path === "/api/spenda/webhook") {
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== (env.SPENDA_WEBHOOK_SECRET || "")) return j({ ok: false, error: "auth" });
    const body = await request.json().catch(() => ({}));
    const { plan, txHash, deviceId, ip } = body;
    if (!plan || !txHash || !env.KEYS) return j({ ok: false, error: "bad_data" });
    const key = `ULT-PREM-${rand(4)}-${rand(4)}-${rand(4)}`;
    const ttlDays = plan === "premium_2w" ? 14 : 30;
    const payload = { key, type: plan, deviceId: deviceId || "", ip: ip || "", created: Date.now(), expires: Date.now() + ttlDays * 86400 * 1000, status: "active", used: false, source: "spenda_auto" };
    try { await env.KEYS.put("key:" + key, JSON.stringify(payload), { expirationTtl: ttlDays * 86400 + 86400 }); } catch (e) {}
    await audit(env, "spenda_auto_issue", { key, plan });
    return j({ ok: true, key, expires: payload.expires });
  }

  // ====== Static fallback — supports /free, /premium, /index, .html versions ======
  const staticFile = resolveStatic(path);
  if (staticFile && env.ASSETS) {
    try { return await env.ASSETS.fetch(new URL(staticFile, request.url)); } catch (e) {}
  }

  return j({ ok: false, error: "not_found", path }, 404);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" } });
    try {
      const response = await route(request, env);
      if (response) return response;
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: "worker_error", message: String(e) }), { status: 500, headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
    }
    if (env.ASSETS) {
      try { return await env.ASSETS.fetch(request); } catch (e) {}
    }
    return new Response("Not Found", { status: 404, headers: { "access-control-allow-origin": "*" } });
  }
};
