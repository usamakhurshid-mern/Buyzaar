export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/admin")) return await admin(request, env, url);
      if (url.pathname === "/content.json") return await publishedContent(request, env);
      if (url.pathname.startsWith("/brand/")) {
        const stored = await storedLogo(env, url.pathname);
        if (stored) return stored;
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error.message || "The live admin API failed." }, 500);
    }
  },
};

async function admin(request, env, url) {
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!env.STORE) return json({ error: "Admin storage is not connected." }, 500);

  const path = url.pathname.replace(/^\/api\/admin/, "").replace(/\/+$/, "") || "/";
  const body = await readJson(request);
  const sent = String(request.headers.get("x-admin-key") || (path === "/login" ? body.password : "")).trim();
  const expected = await currentPassword(env);

  if (path === "/login") {
    return samePassword(sent, expected) ? json({ ok: true }) : json({ error: "Wrong password." }, 401);
  }
  if (!samePassword(sent, expected)) return json({ error: "Wrong password." }, 401);

  if (path === "/password") {
    const next = String(body.password || "").trim();
    if (next.length < 4) return json({ error: "Use at least 4 characters." }, 400);
    await env.STORE.put("password", next);
    return json({ ok: true });
  }

  if (path === "/logo") return saveLogo(env, body);
  if (path === "/content") return saveContent(env, body);
  return json({ error: "The live admin API failed." }, 404);
}

async function currentPassword(env) {
  const saved = await env.STORE.get("password");
  if (saved && saved.trim()) return saved.trim();
  if (env.ADMIN_PASSWORD && String(env.ADMIN_PASSWORD).trim()) return String(env.ADMIN_PASSWORD).trim();
  return "mirra";
}

async function saveContent(env, body) {
  if (!Array.isArray(body.tools) || !Array.isArray(body.categories)) {
    return json({ error: "The draft is missing tools or categories." }, 400);
  }
  const encoded = JSON.stringify(body);
  if (encoded.length > 10_000_000) return json({ error: "That catalog is too large to save." }, 400);
  await env.STORE.put("content", encoded);
  return json({ ok: true });
}

async function publishedContent(request, env) {
  const saved = env.STORE ? await env.STORE.get("content") : null;
  if (!saved) return env.ASSETS.fetch(request);
  return new Response(saved, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function saveLogo(env, body) {
  const match = String(body.dataUrl || "").match(
    /^data:(image\/(?:png|jpeg|webp|gif|svg\+xml))(?:;charset=[^;,]+)?;base64,([A-Za-z0-9+/=\s]+)$/,
  );
  if (!match) return json({ error: "Use a PNG, JPG, WEBP, GIF, or SVG." }, 400);
  const bytes = decodeBase64(match[2]);
  if (!bytes.length || bytes.length > 2_000_000) return json({ error: "Keep the logo under 2 MB." }, 400);
  const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" }[match[1]];
  const file = `logo-${Date.now()}.${ext}`;
  await env.STORE.put(`logo:${file}`, bytes, { metadata: { type: match[1] } });
  return json({ url: `/brand/${file}` });
}

async function storedLogo(env, pathname) {
  if (!env.STORE) return null;
  const name = pathname.slice("/brand/".length);
  if (!/^logo-\d+\.(png|jpg|webp|gif|svg)$/.test(name)) return null;
  const stored = await env.STORE.getWithMetadata(`logo:${name}`, "arrayBuffer");
  if (!stored.value) return null;
  return new Response(stored.value, {
    headers: {
      "content-type": stored.metadata?.type || "application/octet-stream",
      "cache-control": "public, max-age=86400",
    },
  });
}

function samePassword(sent, expected) {
  const typed = String(sent || "").trim();
  const stored = String(expected || "").trim();
  return typed.length > 0 && typed.toLowerCase() === stored.toLowerCase();
}

function decodeBase64(value) {
  const binary = atob(String(value || "").replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
