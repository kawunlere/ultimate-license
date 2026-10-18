// ============== helpers ==============
function j(o) { return new Response(JSON.stringify(o), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } }); }
function rand(n) { var c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; var s = ""; for (var i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
function uuid() { return "u-" + rand(8) + "-" + rand(4) + "-" + rand(4) + "-" + rand(4); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]; }); }
function fmtDate(ms) { if (!ms) return "—"; try { return new Date(ms).toISOString().slice(0,16).replace("T"," "); } catch (e) { return "—"; } }

// ============== static resolver ==============
function resolveStatic(path) {
  var p = path;
  while (p.length > 1 && p.charAt(p.length - 1) === "/") p = p.substring(0, p.length - 1);
  if (p === "" || p === "/") return "/index.html";
  if (p === "/index") return "/index.html";
  if (p === "/free") return "/free.html";
  if (p === "/premium") return "/premium.html";
  if (p === "/donate") return "/donate.html";
  if (p === "/style") return "/style.css";
  if (p === "/index.html" || p === "/free.html" || p === "/premium.html" || p === "/donate.html" || p === "/style.css") return p;
  return null;
}

// ============== owner panel HTML (ES5 only) ==============
function ownerPage(token) {
  var tokenStr = JSON.stringify(token);
  return [
'<!doctype html><html lang="en"><head><meta charset="utf-8">',
'<meta name="viewport" content="width=device-width,initial-scale=1">',
'<title>Owner Panel — Ultimate License</title>',
'<link rel="stylesheet" href="/style">',
'<style>',
'.owner-wrap{max-width:920px;margin:0 auto;padding:24px 18px 60px}',
'.owner-head{display:flex;align-items:center;gap:14px;margin-bottom:22px}',
'.owner-mark{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#D4AF37,#8a6f1a);display:flex;align-items:center;justify-content:center;font-weight:800;color:#0b0d12;font-family:Inter,system-ui,sans-serif;font-size:20px;box-shadow:0 8px 24px rgba(212,175,55,.25)}',
'.owner-title{font-size:22px;font-weight:700;color:#fff;font-family:Inter,system-ui,sans-serif}',
'.owner-sub{font-size:12px;color:#9aa3b2;letter-spacing:.1em;text-transform:uppercase;margin-top:2px}',
'.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}',
'@media(max-width:640px){.stat-grid{grid-template-columns:repeat(2,1fr)}}',
'.stat{background:rgba(20,24,34,.55);backdrop-filter:blur(14px);border:1px solid rgba(212,175,55,.12);border-radius:14px;padding:16px 14px;position:relative;overflow:hidden}',
'.stat::before{content:"";position:absolute;top:0;left:0;width:36px;height:3px;background:linear-gradient(90deg,#D4AF37,transparent)}',
'.stat .num{font-size:26px;font-weight:800;color:#fff;font-family:Inter,system-ui,sans-serif}',
'.stat .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9aa3b2;margin-top:4px}',
'.card{background:rgba(20,24,34,.55);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:22px;margin-bottom:18px}',
'.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}',
'.section{font-size:16px;font-weight:700;color:#fff;margin:0;font-family:Inter,system-ui,sans-serif}',
'.pill{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#D4AF37;padding:5px 10px;border:1px solid rgba(212,175,55,.35);border-radius:999px;background:rgba(212,175,55,.08)}',
'.owner-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
'@media(max-width:640px){.owner-grid{grid-template-columns:1fr}}',
'.owner-grid label{display:flex;flex-direction:column;gap:6px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9aa3b2}',
'.owner-grid select,.owner-grid input{background:rgba(11,13,18,.6);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 13px;color:#fff;font-size:14px;font-family:Inter,system-ui,sans-serif;outline:none}',
'.owner-grid select:focus,.owner-grid input:focus{border-color:rgba(212,175,55,.55)}',
'.row-actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}',
'.btn{padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:Inter,system-ui,sans-serif;transition:transform .15s,box-shadow .15s}',
'.btn.primary{background:linear-gradient(135deg,#D4AF37,#a8861f);color:#0b0d12;box-shadow:0 6px 18px rgba(212,175,55,.25)}',
'.btn.primary:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(212,175,55,.35)}',
'.btn.ghost{background:rgba(255,255,255,.04);color:#fff;border:1px solid rgba(255,255,255,.1)}',
'.btn.ghost:hover{background:rgba(255,255,255,.08)}',
'.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}',
'.output{margin-top:16px;background:rgba(11,13,18,.6);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:16px;min-height:60px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#cdd5e0;white-space:pre-wrap;word-break:break-all}',
'.output .ok{color:#4ade80}',
'.output .err{color:#f87171}',
'.kcard{background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.25);border-radius:10px;padding:14px;margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}',
'.kcard .kcode{font-family:ui-monospace,Menlo,Consolas,monospace;color:#D4AF37;font-weight:700;font-size:14px;word-break:break-all;flex:1;min-width:200px}',
'.kcard .kmeta{font-size:11px;color:#9aa3b2;margin-top:4px}',
'.kcard .kbtn{padding:8px 14px;font-size:12px}',
'.pendrow{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px 14px;margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}',
'.pendrow .pinfo{font-size:13px;color:#cdd5e0;flex:1;min-width:200px}',
'.pendrow .pinfo b{color:#fff}',
'.pendrow .pmeta{font-size:11px;color:#9aa3b2;margin-top:3px;font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-all}',
'.empty{color:#6b7280;font-style:italic;font-size:13px}',
'.footer-note{margin-top:30px;text-align:center;font-size:11px;color:#6b7280}',
'.kbd{font-family:ui-monospace,Menlo,Consolas,monospace;background:rgba(255,255,255,.05);padding:2px 8px;border-radius:5px}',
'</style></head><body>',
'<div class="owner-wrap">',
'<div class="owner-head"><div class="owner-mark">UL</div><div><div class="owner-title">Ultimate License</div><div class="owner-sub">Owner Control Panel</div></div></div>',
'<div class="stat-grid">',
'  <div class="stat"><div class="num" id="statTotal">—</div><div class="lbl">Active Keys</div></div>',
'  <div class="stat"><div class="num" id="statFree">—</div><div class="lbl">Free Trials</div></div>',
'  <div class="stat"><div class="num" id="statPrem">—</div><div class="lbl">Premium</div></div>',
'  <div class="stat"><div class="num" id="statPend">—</div><div class="lbl">Pending</div></div>',
'</div>',
'<div class="card">',
'  <div class="card-head"><h2 class="section">Issue Keys</h2><span class="pill">Generate</span></div>',
'  <form id="issueForm">',
'    <div class="owner-grid">',
'      <label>Type<select name="type" id="type">',
'        <option value="free">Free Trial · 2 days</option>',
'        <option value="premium_2w">Premium · $3 · 2 weeks</option>',
'        <option value="premium_1m">Premium · $5 · 1 month</option>',
'      </select></label>',
'      <label>Plan<select name="plan" id="plan">',
'        <option value="single">Single key</option>',
'        <option value="bulk">Bulk</option>',
'      </select></label>',
'      <label>Count<input type="number" name="count" value="1" min="1" max="500"></label>',
'      <label>Note<input type="text" name="note" placeholder="optional"></label>',
'    </div>',
'    <div class="row-actions">',
'      <button class="btn primary" type="submit">Generate Keys</button>',
'      <button class="btn ghost" type="button" id="copyBtn" disabled>Copy Last</button>',
'      <button class="btn ghost" type="button" id="refreshAllBtn">Refresh</button>',
'    </div>',
'  </form>',
'  <div id="issued" class="output">Generated keys will appear here.</div>',
'</div>',
'<div class="card">',
'  <div class="card-head"><h2 class="section">Pending Premium Approvals</h2></div>',
'  <div id="pending" class="output">No pending requests.</div>',
'</div>',
'<div class="card">',
'  <div class="card-head"><h2 class="section">All Active Keys</h2></div>',
'  <div id="allkeys" class="output">No active keys.</div>',
'</div>',
'<div class="footer-note"><span class="kbd">/owner/&lt;token&gt;</span> · keep this URL private.</div>',
'</div>',
'<script>',
'var TOKEN = ' + tokenStr + ';',
'var API = function(sub) { return "/owner/" + TOKEN + "/api/" + sub; };',
'var lastIssued = [];',
'',
'function api(sub, body) {',
'  var payload = body ? JSON.stringify(body) : "{}";',
'  return fetch(API(sub), { method: "POST", headers: { "content-type": "application/json" }, body: payload }).then(function(r){ return r.json(); }).catch(function(e){ return { ok: false, error: String(e) }; });',
'}',
'',
'function showStats(all, pending) {',
'  var total = all.length;',
'  var free = 0; var prem = 0;',
'  for (var i = 0; i < all.length; i++) { if (all[i].type === "free") free++; else prem++; }',
'  document.getElementById("statTotal").textContent = total;',
'  document.getElementById("statFree").textContent = free;',
'  document.getElementById("statPrem").textContent = prem;',
'  document.getElementById("statPend").textContent = pending.length;',
'}',
'',
'function showIssued(res) {',
'  var el = document.getElementById("issued");',
'  if (!res || !res.ok) { el.innerHTML = "<span class=\"err\">Error: " + esc(res && res.error ? res.error : "unknown") + "</span>"; return; }',
'  var arr = res.generated || [];',
'  if (!arr.length) { el.innerHTML = "<span class=\"empty\">No keys generated.</span>"; return; }',
'  var html = "";',
'  for (var i = 0; i < arr.length; i++) {',
'    var k = arr[i];',
'    var tag = (k.type === "free") ? "FREE" : "PREM";',
'    html += "<div class=\"kcard\"><div><div class=\"kcode\">" + esc(k.key) + "</div><div class=\"kmeta\">" + tag + " · expires " + fmtDate(k.expires) + (k.note ? " · " + esc(k.note) : "") + "</div></div><button class=\"btn primary kbtn\" data-k=\"" + esc(k.key) + "\">Copy</button></div>";',
'  }',
'  el.innerHTML = html;',
'  var btns = el.querySelectorAll(".kbtn");',
'  for (var j = 0; j < btns.length; j++) {',
'    (function(btn){',
'      btn.onclick = function() {',
'        copyToClipboard(btn.getAttribute("data-k")).then(function(){ var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function(){ btn.textContent = t; }, 1200); });',
'      };',
'    })(btns[j]);',
'  }',
'  document.getElementById("copyBtn").disabled = false;',
'  lastIssued = arr;',
'}',
'',
'function showAllKeys(arr) {',
'  var el = document.getElementById("allkeys");',
'  if (!arr.length) { el.innerHTML = "<span class=\"empty\">No active keys.</span>"; return; }',
'  arr.sort(function(a,b){ return (b.created||0) - (a.created||0); });',
'  var html = "";',
'  for (var i = 0; i < arr.length; i++) {',
'    var k = arr[i];',
'    var tag = (k.type === "free") ? "FREE" : "PREM";',
'    html += "<div class=\"kcard\"><div><div class=\"kcode\">" + esc(k.key) + "</div><div class=\"kmeta\">" + tag + " · expires " + fmtDate(k.expires) + (k.used ? " · USED" : "") + "</div></div><button class=\"btn primary kbtn\" data-k=\"" + esc(k.key) + "\">Copy</button></div>";',
'  }',
'  el.innerHTML = html;',
'  var btns = el.querySelectorAll(".kbtn");',
'  for (var j = 0; j < btns.length; j++) {',
'    (function(btn){',
'      btn.onclick = function() {',
'        copyToClipboard(btn.getAttribute("data-k")).then(function(){ var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function(){ btn.textContent = t; }, 1200); });',
'      };',
'    })(btns[j]);',
'  }',
'}',
'',
'function showPending(arr) {',
'  var el = document.getElementById("pending");',
'  if (!arr.length) { el.innerHTML = "<span class=\"empty\">No pending requests.</span>"; return; }',
'  var html = "";',
'  for (var i = 0; i < arr.length; i++) {',
'    var r = arr[i];',
'    html += "<div class=\"pendrow\"><div class=\"pinfo\"><b>" + esc(r.email || "—") + "</b> · " + esc(r.plan || "premium") + "<div class=\"pmeta\">" + esc((r.tx || "").slice(0, 64)) + "</div></div><button class=\"btn primary\" data-id=\"" + esc(r.id) + "\">Approve</button></div>";',
'  }',
'  el.innerHTML = html;',
'  var btns = el.querySelectorAll("button[data-id]");',
'  for (var j = 0; j < btns.length; j++) {',
'    (function(btn){',
'      btn.onclick = function() {',
'        if (!confirm("Approve this request and issue a key?")) return;',
'        btn.disabled = true; btn.textContent = "...";',
'        api("approve", { id: btn.getAttribute("data-id") }).then(function(res){',
'          if (res && res.ok) { btn.textContent = "Issued"; refreshAll(); }',
'          else { alert("Approve failed: " + (res && res.error ? res.error : "unknown")); btn.disabled = false; btn.textContent = "Approve"; }',
'        });',
'      };',
'    })(btns[j]);',
'  }',
'}',
'',
'function copyToClipboard(text) {',
'  if (navigator.clipboard && navigator.clipboard.writeText) { return navigator.clipboard.writeText(text); }',
'  return new Promise(function(resolve, reject){',
'    var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.left = "-9999px";',
'    document.body.appendChild(ta); ta.select();',
'    try { document.execCommand("copy"); resolve(); } catch(e) { reject(e); }',
'    document.body.removeChild(ta);',
'  });',
'}',
'',
'function refreshAll() {',
'  Promise.all([api("list"), api("pending")]).then(function(results){',
'    var allRes = results[0]; var pendRes = results[1];',
'    var all = (allRes && allRes.keys) || [];',
'    var pending = (pendRes && pendRes.pending) || [];',
'    showStats(all, pending);',
'    showAllKeys(all);',
'    showPending(pending);',
'  });',
'}',
'',
'function onIssueSubmit(e) {',
'  if (e && e.preventDefault) e.preventDefault();',
'  var form = document.getElementById("issueForm");',
'  var f = new FormData(form);',
'  var data = { type: f.get("type"), note: f.get("note") || "" };',
'  if (f.get("plan") === "bulk") data.count = parseInt(f.get("count") || "1", 10);',
'  api("issue", data).then(function(res){',
'    showIssued(res);',
'    refreshAll();',
'  });',
'  return false;',
'}',
'',
'window.onload = function() {',
'  var form = document.getElementById("issueForm");',
'  if (form) form.onsubmit = onIssueSubmit;',
'  var copyBtn = document.getElementById("copyBtn");',
'  if (copyBtn) copyBtn.onclick = function() {',
'    if (!lastIssued.length) return;',
'    var txt = "";',
'    for (var i = 0; i < lastIssued.length; i++) { if (i > 0) txt += "\\n"; txt += lastIssued[i].key; }',
'    copyToClipboard(txt).then(function(){ var t = copyBtn.textContent; copyBtn.textContent = "Copied"; setTimeout(function(){ copyBtn.textContent = t; }, 1200); });',
'  };',
'  var refBtn = document.getElementById("refreshAllBtn");',
'  if (refBtn) refBtn.onclick = function() { refreshAll(); };',
'  refreshAll();',
'};',
'</script>',
'</body></html>'
  ].join("");
}

// ============== API routes ==============
function handleVerify(request, env, ip) {
  var body = {};
  try { body = request.json ? null : null; } catch (e) {}
  return request.json().then(function(body){
    var key = (body.key || "").trim();
    if (!key) return j({ ok: false, error: "missing_key" });
    return (env.KEYS ? env.KEYS.get("key:" + key) : Promise.resolve(null)).then(function(raw){
      if (!raw) return j({ ok: false, error: "invalid" });
      var data = JSON.parse(raw);
      if (data.banned) return j({ ok: false, error: "banned" });
      if (data.revoked) return j({ ok: false, error: "revoked" });
      if (data.expires && data.expires < Date.now()) return j({ ok: false, error: "expired" });
      if (data.type === "free") {
        var dev = body.device || "";
        if (!dev) return j({ ok: false, error: "missing_device" });
        if (data.device && data.device !== dev) return j({ ok: false, error: "device_locked" });
        if (data.ip && data.ip !== ip) return j({ ok: false, error: "device_locked" });
        if (!data.device) {
          data.device = dev; data.ip = ip; data.used = true;
          var ttl = Math.max(60, Math.floor((data.expires - Date.now())/1000) + 86400);
          return env.KEYS.put("key:" + key, JSON.stringify(data), { expirationTtl: ttl }).then(function(){
            return j({ ok: true, type: data.type, expires: data.expires, note: data.note || "" });
          });
        }
      }
      return j({ ok: true, type: data.type, expires: data.expires, note: data.note || "" });
    });
  }).catch(function(e){ return j({ ok: false, error: "server_error" }); });
}

function handleFreeStep(request, env, ip) {
  return request.json().then(function(body){
    var step = parseInt(body.step || "0", 10);
    var device = body.device || "";
    if (step < 1 || step > 8) return j({ ok: false, error: "bad_step" });
    var cookie = request.headers.get("cookie") || "";
    var m = cookie.match(/ult_step=(\d+)/);
    var cur = m ? parseInt(m[1], 10) : 0;
    if (step !== cur + 1) return j({ ok: false, error: "chain_incomplete", current: cur });
    if (step === 8) {
      var key = "ULT-FREE-" + rand(4) + "-" + rand(4) + "-" + rand(4);
      var payload = { key: key, type: "free", device: device, ip: ip, created: Date.now(), expires: Date.now() + 2*86400*1000, status: "active", used: false };
      var p = env.KEYS ? env.KEYS.put("key:" + key, JSON.stringify(payload), { expirationTtl: 3*86400 }) : Promise.resolve();
      return p.then(function(){
        var r = j({ ok: true, done: true, key: key });
        r.headers.append("set-cookie", "ult_step=0; Path=/; Max-Age=86400; SameSite=Lax");
        return r;
      });
    }
    var r = j({ ok: true, step: step });
    r.headers.append("set-cookie", "ult_step=" + step + "; Path=/; Max-Age=86400; SameSite=Lax");
    return r;
  }).catch(function(){ return j({ ok: false, error: "bad_request" }); });
}

function handlePremiumSubmit(request, env) {
  return request.json().then(function(body){
    var email = (body.email || "").trim();
    var plan = (body.plan || "premium_2w").trim();
    var tx = (body.tx || "").trim();
    var note = (body.note || "").trim();
    if (!email || !tx) return j({ ok: false, error: "missing_fields" });
    var id = uuid();
    var payload = { id: id, email: email, plan: plan, tx: tx, note: note, created: Date.now(), status: "pending" };
    var p = env.KEYS ? env.KEYS.put("prem_req:" + id, JSON.stringify(payload), { expirationTtl: 7*86400 }) : Promise.resolve();
    return p.then(function(){ return j({ ok: true, id: id }); });
  }).catch(function(){ return j({ ok: false, error: "bad_request" }); });
}

function handleOwnerIssue(request, env) {
  return request.json().then(function(body){
    var type = body.type || "free";
    var note = body.note || "";
    var count = Math.max(1, Math.min(500, parseInt(body.count || "1", 10)));
    var ttlDays = (type === "free") ? 2 : ((type === "premium_2w") ? 14 : 30);
    var brand = (type === "free") ? "FREE" : "PREM";
    var out = [];
    for (var i = 0; i < count; i++) {
      var key = "ULT-" + brand + "-" + rand(4) + "-" + rand(4) + "-" + rand(4);
      var payload = { key: key, type: type, note: note, created: Date.now(), expires: Date.now() + ttlDays*86400*1000, status: "active", used: false };
      out.push(payload);
    }
    var p = Promise.resolve();
    if (env.KEYS) {
      var writes = [];
      for (var k = 0; k < out.length; k++) {
        writes.push(env.KEYS.put("key:" + out[k].key, JSON.stringify(out[k]), { expirationTtl: ttlDays*86400 + 86400 }));
      }
      p = Promise.all(writes);
    }
    return p.then(function(){ return j({ ok: true, generated: out }); });
  }).catch(function(){ return j({ ok: false, error: "bad_request" }); });
}

function handleOwnerList(env) {
  if (!env.KEYS) return Promise.resolve(j({ ok: false, error: "no_kv" }));
  return env.KEYS.list({ prefix: "key:" }).then(function(list){
    var reads = [];
    for (var i = 0; i < list.keys.length; i++) reads.push(env.KEYS.get(list.keys[i].name));
    return Promise.all(reads).then(function(vals){
      var keys = [];
      for (var j = 0; j < vals.length; j++) if (vals[j]) keys.push(JSON.parse(vals[j]));
      return j({ ok: true, count: keys.length, keys: keys });
    });
  }).catch(function(e){ return j({ ok: false, error: String(e) }); });
}

function handleOwnerPending(env) {
  if (!env.KEYS) return Promise.resolve(j({ ok: false, error: "no_kv" }));
  return env.KEYS.list({ prefix: "prem_req:" }).then(function(list){
    var reads = [];
    for (var i = 0; i < list.keys.length; i++) reads.push(env.KEYS.get(list.keys[i].name));
    return Promise.all(reads).then(function(vals){
      var pending = [];
      for (var j = 0; j < vals.length; j++) {
        if (vals[j]) { var r = JSON.parse(vals[j]); if (r.status === "pending") pending.push(r); }
      }
      return j({ ok: true, count: pending.length, pending: pending });
    });
  }).catch(function(e){ return j({ ok: false, error: String(e) }); });
}

function handleOwnerApprove(request, env) {
  return request.json().then(function(body){
    var id = body.id || "";
    if (!id) return j({ ok: false, error: "missing_id" });
    if (!env.KEYS) return j({ ok: false, error: "no_kv" });
    return env.KEYS.get("prem_req:" + id).then(function(raw){
      if (!raw) return j({ ok: false, error: "not_found" });
      var req = JSON.parse(raw);
      if (req.status !== "pending") return j({ ok: false, error: "already_processed" });
      var ttlDays = (req.plan === "premium_1m") ? 30 : 14;
      var key = "ULT-PREM-" + rand(4) + "-" + rand(4) + "-" + rand(4);
      var payload = { key: key, type: req.plan, note: "auto-approved:" + (req.email || ""), created: Date.now(), expires: Date.now() + ttlDays*86400*1000, status: "active", used: false };
      return env.KEYS.put("key:" + key, JSON.stringify(payload), { expirationTtl: ttlDays*86400 + 86400 }).then(function(){
        req.status = "approved"; req.key = key; req.approved = Date.now();
        return env.KEYS.put("prem_req:" + id, JSON.stringify(req), { expirationTtl: 7*86400 }).then(function(){
          return j({ ok: true, key: key, request: req });
        });
      });
    });
  }).catch(function(e){ return j({ ok: false, error: String(e) }); });
}

// ============== router ==============
function route(request, env) {
  var url = new URL(request.url);
  var path = url.pathname;
  var ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  var ownerToken = env.OWNER_TOKEN || "";

  var ownerBase = "/owner/" + ownerToken;
  if (path === ownerBase || path === ownerBase + "/") {
    return Promise.resolve(new Response(ownerPage(ownerToken), { headers: { "content-type": "text/html; charset=utf-8" } }));
  }
  if (path.indexOf(ownerBase + "/api/") === 0) {
    var sub = path.substring((ownerBase + "/api/").length);
    if (sub === "issue") return handleOwnerIssue(request, env);
    if (sub === "list") return handleOwnerList(env);
    if (sub === "pending") return handleOwnerPending(env);
    if (sub === "approve") return handleOwnerApprove(request, env);
    return Promise.resolve(j({ ok: false, error: "unknown_op" }));
  }

  if (path === "/api/verify-key" && request.method === "POST") return handleVerify(request, env, ip);
  if (path === "/api/free-step" && request.method === "POST") return handleFreeStep(request, env, ip);
  if (path === "/api/premium-submit" && request.method === "POST") return handlePremiumSubmit(request, env);

  if (request.method !== "GET" && request.method !== "HEAD") return Promise.resolve(j({ ok: false, error: "method_not_allowed" }));

  var resolved = resolveStatic(path);
  if (!resolved) return Promise.resolve(new Response("not_found", { status: 404, headers: { "access-control-allow-origin": "*" } }));
  try {
    var r = env.ASSETS.fetch(new Request(new URL(resolved, request.url)));
    return r.then(function(res){ return new Response(res.body, res); });
  } catch (e) {
    return Promise.resolve(new Response("asset_error: " + String(e), { status: 500 }));
  }
}

export default { fetch: route };
