export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const token = url.pathname.split("/")[2];
  if (token !== env.OWNER_TOKEN) return new Response("Forbidden", { status: 403 });
  const list = await env.KEYS.list({ prefix: "key:" });
  const items = [];
  for (const k of list.keys.slice(0, 100)) { const v = await env.KEYS.get(k.name); if (v) items.push({ key: k.name.replace("key:", ""), ...JSON.parse(v) }); }
  return new Response(JSON.stringify(items, null, 2), { headers: { "content-type": "application/json" } });
}
