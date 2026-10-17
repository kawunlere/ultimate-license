export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname;
  const token = path.split("/")[2];
  if (token !== env.OWNER_TOKEN) return new Response("Forbidden", { status: 403 });
  if (path === "/owner/" + token) return ownerPage(token);
  return new Response("Not Found", { status: 404 });
}
function ownerPage(tok) {
  return new Response(`<!doctype html><html><head><title>Owner</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;background:#0d1117;color:#e6edf3;margin:0;padding:24px;font-size:13px}
.c{max-width:560px;margin:0 auto}.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px;margin-bottom:14px}
h2{color:#d4af37;font-size:18px;margin:0 0 14px}input,select{width:100%;padding:10px;background:#000;border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:8px;margin-bottom:8px;font-size:13px}
button{padding:10px 18px;background:linear-gradient(135deg,#d4af37,#b8941f);color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-right:6px}
pre{background:#000;padding:12px;border-radius:8px;font-size:11px;overflow:auto;max-height:300px;color:#00d4ff;white-space:pre-wrap}</style></head><body>
<div class="c"><h2>Owner Control</h2>
<div class="card"><h2 style="font-size:14px">Manual Issue</h2>
<input id="d" placeholder="Device ID (blank = any)">
<select id="t"><option value="premium">Premium</option><option value="owner">Owner</option></select>
<input id="days" type="number" value="14">
<button onclick="issue()">Generate</button>
<pre id="o"></pre></div>
<div class="card"><h2 style="font-size:14px">Pending Payments</h2>
<button onclick="load('pending')">Load</button>
<pre id="p"></pre></div>
<div class="card"><h2 style="font-size:14px">Active Keys</h2>
<button onclick="load('list')">Load</button>
<pre id="l"></pre></div>
</div><script>
async function issue(){const r=await fetch('/owner/${tok}/api/issue',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({deviceId:d.value,type:t.value,days:parseInt(days.value)})});o.textContent=(await r.json()).key||'';}
async function load(x){const r=await fetch('/owner/${tok}/api/'+x);document.getElementById(x==='pending'?'p':'l').textContent=await r.text();}
</script></body></html>`, { headers: { "content-type": "text/html" } });
}
