// ============== helpers ==============
function j(o) { return new Response(JSON.stringify(o), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } }); }
function rand(n) { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
function uuid() { return "u-" + rand(8) + "-" + rand(4) + "-" + rand(4) + "-" + rand(4); }

// ============== static resolver ==============
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

// ============== owner panel HTML ==============
function ownerPage(token) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Owner Panel — Ultimate License</title>
<link rel="stylesheet" href="/style">
<style>
.owner-wrap{max-width:920px;margin:0 auto;padding:24px 18px 60px}
.owner-head{display:flex;align-items:center;gap:14px;margin-bottom:22px}
.owner-mark{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#D4AF37,#8a6f1a);display:flex;align-items:center;justify-content:center;font-weight:800;color:#0b0d12;font-family:Inter,system-ui,sans-serif;font-size:20px;box-shadow:0 8px 24px rgba(212,175,55,.25)}
.owner-title{font-size:22px;font-weight:700;color:#fff;font-family:Inter,system-ui,sans-serif}
.owner-sub{font-size:12px;color:#9aa3b2;letter-spacing:.1em;text-transform:uppercase;margin-top:2px}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
@media(max-width:640px){.stat-grid{grid-template-columns:repeat(2,1fr)}}
.stat{background:rgba(20,24,34,.55);backdrop-filter:blur(14px);border:1px solid rgba(212,175,55,.12);border-radius:14px;padding:16px 14px;position:relative;overflow:hidden}
.stat::before{content:"";position:absolute;top:0;left:0;width:36px;height:3px;background:linear-gradient(90deg,#D4AF37,transparent)}
.stat .num{font-size:26px;font-weight:800;color:#fff;font-family:Inter,system-ui,sans-serif}
.stat .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9aa3b2;margin-top:4px}
.card{background:rgba(20,24,34,.55);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:22px;margin-bottom:18px}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.section{font-size:16px;font-weight:700;color:#fff;margin:0;font-family:Inter,system-ui,sans-serif}
.pill{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#D4AF37;padding:5px 10px;border:1px solid rgba(212,175,55,.35);border-radius:999px;background:rgba(212,175,55,.08)}
.owner-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:640px){.owner-grid{grid-template-columns:1fr}}
.owner-grid label{display:flex;flex-direction:column;gap:6px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9aa3b2}
.owner-grid select,.owner-grid input{background:rgba(11,13,18,.6);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 13px;color:#fff;font-size:14px;font-family:Inter,system-ui,sans-serif;outline:none}
.owner-grid select:focus,.owner-grid input:focus{border-color:rgba(212,175,55,.55)}
.row-actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
.btn{padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:Inter,system-ui,sans-serif;transition:transform .15s,box-shadow .15s}
.btn.primary{background:linear-gradient(135deg,#D4AF37,#a8861f);color:#0b0d12;box-shadow:0 6px 18px rgba(212,175,55,.25)}
.btn.primary:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(212,175,55,.35)}
.btn.ghost{background:rgba(255,255,255,.04);color:#fff;border:1px solid rgba(255,255,255,.1)}
.btn.ghost:hover{background:rgba(255,255,255,.08)}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.output{margin-top:16px;background:rgba(11,13,18,.6);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:16px;min-height:60px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#cdd5e0;white-space:pre-wrap;word-break:break-all}
.output .ok{color:#4ade80}
.output .err{color:#f87171}
.kcard{background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.25);border-radius:10px;padding:14px;margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.kcard .kcode{font-family:ui-monospace,Menlo,Consolas,monospace;color:#D4AF37;font-weight:700;font-size:14px;word-break:break-all;flex:1;min-width:200px}
.kcard .kmeta{font-size:11px;color:#9aa3b2;margin-top:4px}
.kcard .kbtn{padding:8px 14px;font-size:12px}
.pendrow{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px 14px;margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.pendrow .pinfo{font-size:13px;color:#cdd5e0;flex:1;min-width:200px}
.pendrow .pinfo b{color:#fff}
.pendrow .pmeta{font-size:11px;color:#9aa3b2;margin-top:3px;font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-all}
.empty{color:#6b7280;font-style:italic;font-size:13px}
.footer-note{margin-top:30px;text-align:center;font-size:11px;color:#6b7280}
.kbd{font-family:ui-monospace,Menlo,Consolas,monospace;background:rgba(255,255,255,.05);padding:2px 8px;border-radius:5px}
</style></head><body>
<div class="owner-wrap">
<div class="owner-head">
  <div class="owner-mark">UL</div>
  <div><div class="owner-title">Ultimate License</div><div class="owner-sub">Owner Control Panel</div></div>
</div>

<div class="stat-grid">
  <div class="stat"><div class="num" id="statTotal">—</div><div class="lbl">Active Keys</div></div>
  <div class="stat"><div class="num" id="statFree">—</div><div class="lbl">Free Trials</div></div>
  <div class="stat"><div class="num" id="statPrem">—</div><div class="lbl">Premium</div></div>
  <div class="stat"><div class="num" id="statPend">—</div><div class="lbl">Pending</div></div>
</div>

<div class="card">
  <div class="card-head"><h2 class="section">Issue Keys</h2><span class="pill">Generate</span></div>
  <form id="issueForm">
    <div class="owner-grid">
      <label>Type<select name="type" id="type">
        <option value="free">Free Trial · 2 days</option>
        <option value="premium_2w">Premium · $3 · 2 weeks</option>
        <option value="premium_1m">Premium · $5 · 1 month</option>
      </select></label>
      <label>Plan<select name="plan" id="plan">
        <option value="single">Single key</option>
        <option value="bulk">Bulk</option>
      </select></label>
      <label>Count<input type="number" name="count" value="1" min="1" max="500"></label>
      <label>Note<input type="text" name="note" placeholder="optional"></label>
    </div>
    <div class="row-actions">
      <button class="btn primary" type="submit">Generate Keys</button>
      <button class="btn ghost" type="button" id="copyBtn" disabled>Copy Last</button>
      <button class="btn ghost" type="button" id="refreshAllBtn">Refresh</button>
    </div>
  </form>
  <div id="issued" class="output">Generated keys will appear here.</div>
</div>

<div class="card">
  <div class="card-head"><h2 class="section">Pending Premium Approvals</h2></div>
  <div id="pending" class="output">No pending requests.</div>
</div>

<div class="card">
  <div class="card-head"><h2 class="section">All Active Keys</h2></div>
  <div id="allkeys" class="output">No active keys.</div>
</div>

<div class="footer-note"><span class="kbd">/owner/&lt;token&gt;</span> · keep this URL private.</div>
</div>

<script>
const TOKEN = ${JSON.stringify(token)};
const API = (sub) => "/owner/" + TOKEN + "/api/" + sub;

async function api(sub, body) {
  try {
    const r = await fetch(API(sub), { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : "{}" });
    return await r.json();
  } catch (e) { return { ok: false, error: String(e) }; }
}

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function showStats(all, pending) {
  const total = all.length;
  const free = all.filter(k => k.type === "free").length;
  const prem = all.filter(k => (k.type || "").startsWith("premium")).length;
  document.getElementById("statTotal").textContent = total;
  document.getElementById("statFree").textContent = free;
  document.getElementById("statPrem").textContent = prem;
  document.getElementById("statPend").textContent = pending.length;
}

function showIssued(res) {
  const el = document.getElementById("issued");
  if (!res.ok) { el.innerHTML = '<span class="err">Error: ' + esc(res.error || "unknown") + '</span>'; return; }
  const arr = res.generated || [];
  if (!arr.length) { el.innerHTML = '<span class="empty">No keys generated.</span>'; return; }
  let html = "";
  arr.forEach(k => {
    const exp = k.expires ? new Date(k.expires).toISOString().slice(0,16).replace("T"," ") : "—";
    const tag = k.type === "free" ? "FREE" : "PREM";
    html += '<div class="kcard"><div><div class="kcode">' + esc(k.key) + '</div><div class="kmeta">' + tag + ' · expires ' + exp + (k.note ? ' · ' + esc(k.note) : '') + '</div></div><button class="btn primary kbtn" data-k="' + esc(k.key) + '">Copy</button></div>';
  });
  el.innerHTML = html;
  el.querySelectorAll(".kbtn").forEach(b => {
    b.onclick = async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.k);
        const t = b.textContent; b.textContent = "Copied"; setTimeout(() => b.textContent = t, 1200);
      } catch (e) { alert("Copy failed: " + e); }
    };
  });
  document.getElementById("copyBtn").disabled = false;
  window.__lastIssued = arr;
}

function showAllKeys(arr) {
  const el = document.getElementById("allkeys");
  if (!arr.length) { el.innerHTML = '<span class="empty">No active keys.</span>'; return; }
  arr.sort((a,b) => (b.created||0) - (a.created||0));
  let html = "";
  arr.forEach(k => {
    const exp = k.expires ? new Date(k.expires).toISOString().slice(0,16).replace("T"," ") : "—";
    const tag = k.type === "free" ? "FREE" : "PREM";
    html += '<div class="kcard"><div><div class="kcode">' + esc(k.key) + '</div><div class="kmeta">' + tag + ' · expires ' + exp + (k.used ? ' · USED' : '') + '</div></div><button class="btn primary kbtn" data-k="' + esc(k.key) + '">Copy</button></div>';
  });
  el.innerHTML = html;
  el.querySelectorAll(".kbtn").forEach(b => {
    b.onclick = async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.k);
        const t = b.textContent; b.textContent = "Copied"; setTimeout(() => b.textContent = t, 1200);
      } catch (e) {}
    };
  });
}

function showPending(arr) {
  const el = document.getElementById("pending");
  if (!arr.length) { el.innerHTML = '<span class="empty">No pending requests.</span>'; return; }
  let html = "";
  arr.forEach(r => {
    html += '<div class="pendrow"><div class="pinfo"><b>' + esc(r.email || "—") + '</b> · ' + esc(r.plan || "premium") + '<div class="pmeta">' + esc((r.tx || "").slice(0, 64)) + '</div></div><button class="btn primary" data-id="' + esc(r.id) + '">Approve</button></div>';
  });
  el.innerHTML = html;
  el.querySelectorAll("button[data-id]").forEach(b => {
    b.onclick = async () => {
      if (!confirm("Approve this request and issue a key?")) return;
      b.disabled = true; b.textContent = "...";
      const res = await api("approve", { id: b.dataset.id });
      if (res.ok) { b.textContent = "Issued"; refreshAll(); }
      else { alert("Approve failed: " + (res.error || "unknown")); b.disabled = false; b.textContent = "Approve"; }
    };
  });
}

async function refreshAll() {
  const [allRes, pendRes] = await Promise.all([api("list"), api("pending")]);
  const all = (allRes && allRes.keys) || [];
  const pending = (pendRes && pendRes.pending) || [];
  showStats(all, pending);
  showAllKeys(all);
  showPending(pending);
}

document.getElementById("issueForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const data = { type: f.get("type"), note: f.get("note") || "" };
  if (f.get("plan") === "bulk") data.count = parseInt(f.get("count") || "1", 10);
  const res = await api("issue", data);
  showIssued(res);
  refreshAll();
});

document.getElementById("copyBtn").onclick = async () => {
  if (!window.__lastIssued) return;
  const txt = window.__lastIssued.map(k => k.key).join("\n");
  try { await navigator.clipboard.writeText(txt); const t = document.getElementById("copyBtn").textContent; document.getElementById("copyBtn").textContent = "Copied"; setTimeout(() => document.getElementById("copyBtn").textContent = t, 1200); } catch (e) {}
};

document.getElementById("refreshAllBtn").onclick = () => refreshAll();
refreshAll();
</script>
</body></html>`;
}

// ============== API routes ==============
async function handleVerify(request, env, ip) {
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const key = (body.key || "").trim();
  if (!key) return j({ ok: false, error: "missing_key" });
  try {
    const raw = env.KEYS ? await env.KEYS.get("key:" + key) : null;
    if (!raw) return j({ ok: false, error: "invalid" });
    const data = JSON.parse(raw);
    if (data.banned) return j({ ok: false, error: "banned" });
    if (data.revoked) return j({ ok: false, error: "revoked" });
    if (data.expires && data.expires < Date.now()) return j({ ok: false, error: "expired" });
    if (data.type === "free") {
      const dev = body.device || "";
      if (!dev) return j({ ok: false, error: "missing_device" });
      if (data.device && data.device !== dev) return j({ ok: false, error: "device_locked" });
      if (data.ip && data.ip !== ip) return j({ ok: false, error: "device_locked" });
      if (!data.device) { data.device = dev; data.ip = ip; data.used = true; await env.KEYS.put("key:" + key, JSON.stringify(data), { expirationTtl: Math.max(60, Math.floor((data.expires - Date.now())/1000) + 86400) }); }
    }
    return j({ ok: true, type: data.type, expires: data.expires, note: data.note || "" });
  } catch (e) { return j({ ok: false, error: "server_error" }); }
}

async function handleFreeStep(request, env, ip) {
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const step = parseInt(body.step || "0", 10);
  const device = body.device || "";
  if (step < 1 || step > 8) return j({ ok: false, error: "bad_step" });
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/ult_step=(\d+)/);
  const cur = m ? parseInt(m[1], 10) : 0;
  if (step !== cur + 1) return j({ ok: false, error: "chain_incomplete", current: cur });
  if (step === 8) {
    const key = "ULT-FREE-" + rand(4) + "-" + rand(4) + "-" + rand(4);
    const payload = { key, type: "free", device, ip, created: Date.now(), expires: Date.now() + 2 * 86400 * 1000, status: "active", used: false };
    try { if (env.KEYS) await env.KEYS.put("key:" + key, JSON.stringify(payload), { expirationTtl: 3 * 86400 }); } catch (e) {}
    const r = j({ ok: true, done: true, key });
    r.headers.append("set-cookie", "ult_step=0; Path=/; Max-Age=86400; SameSite=Lax");
    return r;
  }
  const r = j({ ok: true, step });
  r.headers.append("set-cookie", "ult_step=" + step + "; Path=/; Max-Age=86400; SameSite=Lax");
  return r;
}

async function handlePremiumSubmit(request, env) {
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const email = (body.email || "").trim();
  const plan = (body.plan || "premium_2w").trim();
  const tx = (body.tx || "").trim();
  const note = (body.note || "").trim();
  if (!email || !tx) return j({ ok: false, error: "missing_fields" });
  const id = uuid();
  const payload = { id, email, plan, tx, note, created: Date.now(), status: "pending" };
  try { if (env.KEYS) await env.KEYS.put("prem_req:" + id, JSON.stringify(payload), { expirationTtl: 7 * 86400 }); } catch (e) {}
  return j({ ok: true, id });
}

async function handleOwnerIssue(request, env) {
  let body = {};
  try { body = await request.json(); } catch (e) {}
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

async function handleOwnerList(env) {
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

async function handleOwnerPending(env) {
  try {
    if (!env.KEYS) return j({ ok: false, error: "no_kv" });
    const list = await env.KEYS.list({ prefix: "prem_req:" });
    const pending = [];
    for (const k of list.keys) {
      const v = await env.KEYS.get(k.name);
      if (v) { const r = JSON.parse(v); if (r.status === "pending") pending.push(r); }
    }
    return j({ ok: true, count: pending.length, pending });
  } catch (e) { return j({ ok: false, error: String(e) }); }
}

async function handleOwnerApprove(request, env) {
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const id = body.id || "";
  if (!id) return j({ ok: false, error: "missing_id" });
  try {
    if (!env.KEYS) return j({ ok: false, error: "no_kv" });
    const raw = await env.KEYS.get("prem_req:" + id);
    if (!raw) return j({ ok: false, error: "not_found" });
    const req = JSON.parse(raw);
    if (req.status !== "pending") return j({ ok: false, error: "already_processed" });
    const ttlDays = req.plan === "premium_1m" ? 30 : 14;
    const key = "ULT-PREM-" + rand(4) + "-" + rand(4) + "-" + rand(4);
    const payload = { key, type: req.plan, note: "auto-approved:" + (req.email || ""), created: Date.now(), expires: Date.now() + ttlDays * 86400 * 1000, status: "active", used: false };
    await env.KEYS.put("key:" + key, JSON.stringify(payload), { expirationTtl: ttlDays * 86400 + 86400 });
    req.status = "approved"; req.key = key; req.approved = Date.now();
    await env.KEYS.put("prem_req:" + id, JSON.stringify(req), { expirationTtl: 7 * 86400 });
    return j({ ok: true, key, request: req });
  } catch (e) { return j({ ok: false, error: String(e) }); }
}

// ============== router ==============
async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const ownerToken = env.OWNER_TOKEN || "";

  const ownerBase = "/owner/" + ownerToken;
  if (path === ownerBase || path === ownerBase + "/") {
    return new Response(ownerPage(ownerToken), { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  if (path.startsWith(ownerBase + "/api/")) {
    const sub = path.substring((ownerBase + "/api/").length);
    if (sub === "issue") return handleOwnerIssue(request, env);
    if (sub === "list") return handleOwnerList(env);
    if (sub === "pending") return handleOwnerPending(env);
    if (sub === "approve") return handleOwnerApprove(request, env);
    return j({ ok: false, error: "unknown_op" });
  }

  if (path === "/api/verify-key" && request.method === "POST") return handleVerify(request, env, ip);
  if (path === "/api/free-step" && request.method === "POST") return handleFreeStep(request, env, ip);
  if (path === "/api/premium-submit" && request.method === "POST") return handlePremiumSubmit(request, env);

  if (request.method !== "GET" && request.method !== "HEAD") return j({ ok: false, error: "method_not_allowed" });

  const resolved = resolveStatic(path);
  if (!resolved) return new Response("not_found", { status: 404, headers: { "access-control-allow-origin": "*" } });
  try {
    const r = await env.ASSETS.fetch(new Request(new URL(resolved, request.url)));
    return new Response(r.body, r);
  } catch (e) {
    return new Response("asset_error: " + String(e), { status: 500 });
  }
}

export default { fetch: route };
