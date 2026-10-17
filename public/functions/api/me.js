import { j, newDevice, getDeviceId, corsHeaders } from "../_shared.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  let did = getDeviceId(request);
  if (!did) did = await newDevice();
  const r = j({ deviceId: did });
  r.headers.append("Set-Cookie", "ult_did=" + did + "; Path=/; Max-Age=31536000; SameSite=Strict");
  return r;
}
