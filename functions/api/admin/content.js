import { json, readBody, requireAdmin } from "../../_lib.js";

export async function onRequestPost({ request, env }) {
  const body = await readBody(request);
  if (!body) return json(400, { error: "The draft could not be read." });
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (!Array.isArray(body.tools) || !Array.isArray(body.categories)) {
    return json(400, { error: "The draft is missing tools or categories." });
  }
  await env.STORE.put("content", JSON.stringify(body));
  return json(200, { ok: true });
}
