const DEFAULT_PASSWORD = "buyzaar";

export function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function requireStore(env) {
  if (!env.BUYZAAR) {
    return json(503, {
      error: "Admin storage is not connected. In Cloudflare Pages, open Settings, Functions, KV namespace bindings, and bind a namespace as BUYZAAR.",
    });
  }
  return null;
}

export function samePassword(sent, expected) {
  const typed = String(sent || "").trim();
  const stored = String(expected || "").trim();
  return typed.length > 0 && typed === stored;
}

export async function readPassword(env) {
  const stored = await env.BUYZAAR.get("password");
  return String(stored || DEFAULT_PASSWORD).trim();
}

export async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return null;
  }
}

export async function requireAdmin(request, env) {
  const missing = requireStore(env);
  if (missing) return { error: missing };
  const expected = await readPassword(env);
  const sent = request.headers.get("x-admin-key");
  if (!samePassword(sent, expected)) {
    return { error: json(401, { error: "Your session expired. Sign in again." }) };
  }
  return { expected };
}

export function checkLogo(dataUrl) {
  const match = String(dataUrl || "").match(
    /^data:(image\/(?:png|jpeg|webp|gif|svg\+xml))(?:;charset=[^;,]+)?;base64,([A-Za-z0-9+/=\s]+)$/,
  );
  if (!match) return { error: "Use a PNG, JPG, WEBP, GIF, or SVG." };
  const clean = match[2].replace(/\s/g, "");
  const bytes = Math.floor((clean.length * 3) / 4);
  if (!clean.length || bytes > 2_000_000) return { error: "Keep the logo under 2 MB." };
  return { dataUrl: `data:${match[1]};base64,${clean}` };
}
