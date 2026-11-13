import { json, readBody, readPassword, requireStore, samePassword } from "../../_lib.js";

export async function onRequestPost({ request, env }) {
  const missing = requireStore(env);
  if (missing) return missing;
  const body = await readBody(request);
  if (!body) return json(400, { error: "Send a JSON password." });
  const ok = samePassword(body.password, await readPassword(env));
  return json(ok ? 200 : 401, ok ? { ok: true } : { error: "Wrong password." });
}
