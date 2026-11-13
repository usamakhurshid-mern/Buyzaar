import { checkLogo, json, readBody, requireAdmin } from "../../_lib.js";

export async function onRequestPost({ request, env }) {
  const body = await readBody(request);
  if (!body) return json(400, { error: "Send a JSON logo." });
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const checked = checkLogo(body.dataUrl);
  if (checked.error) return json(400, { error: checked.error });
  return json(200, { url: checked.dataUrl });
}
