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
<link rel="stylesheet" href="/style.css">
</head><body>
<div class="container" style="max-width:720px;margin:24px auto;">
<h1 class="title">Owner Panel</h1>
<p class="muted">Ultimate License — private control panel</p>

<section class="card">
<h2 class="section">Issue Keys</h2>
<form id="issueForm">
<div class="grid">
<label>Type
<select name="type" id="type">
<option value="free">Free Trial (2 days)</option>
<option value="premium_2w">Premium — $3 / 2 weeks</option>
<option value="premium_1m">Premium — $5 / 1 month</option>
</select>
</label>
<label>Plan
<select name="plan" id="plan">
<option value="single">Single key</option>
<option value="bulk">Bulk (count)</option>
</select>
</label>
<label>Count
<input type="number" name="count" id="count" value="1" min="1" max="500">
</label>
<label>Note
<input type="text" name="note" placeholder="optional">
</label>
</div>
<button class="btn primary" type="submit">Generate</button>
</form>
<pre id="issued" class="output"></pre>
</section>

<section class="card">
<h2 class="section">Pending Premium Approvals</h2>
<button class="btn" id="loadPending">Load pending</button>
<pre id="pending" class="output"></pre>
</section>

<section class="card">
<h2 class="section">All Active Keys</h2>
<button class="btn" id="loadAll">Load all</button>
<pre id="allkeys" class="output"></pre>
</section>

</div>

<script>
const TOKEN = ${JSON.stringify(token)};
const API = (sub) => "/owner/" + TOKEN + "/api/" + sub;
async function api(sub, body) {
  const r = await fetch(API(sub), { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : "{}" });
  return r.json();
}
document.getElementById("issueForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const plan = f.get("plan");
  const data = { type: f.get("type"), note: f.get("note") || "" };
  if (plan === "bulk") data.count = parseInt(f.get("count") || "1", 10);
  const res = await api("issue", data);
  document.getElementById("issued").textContent = JSON.stringify(res, null, 2);
});
document.getElementById("loadPending").onclick = async () => {
  const res = await api("pending", {});
  document.getElementById("pending").textContent = JSON.stringify(res, null, 2);
};
document.getElementById("loadAll").onclick = async () => {
  const res = await api("list", {});
  document.getElementById("allkeys").textContent = JSON.stringify(res, null, 2);
};
</script>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": "*" } });
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
