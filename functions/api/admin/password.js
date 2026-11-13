import { json, readBody, requireAdmin } from "../../_lib.js";

export async function onRequestPost({ request, env }) {
  const body = await readBody(request);
  if (!body) return json(400, { error: "Send a JSON password." });
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const next = String(body.password || "").trim();
  if (next.length < 4) return json(400, { error: "Use at least 4 characters." });
  await env.BUYZAAR.put("password", next);
  return json(200, { ok: true });
}
