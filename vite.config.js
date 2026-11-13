import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function adminPath(req) {
  const raw = String(req.url || "").split("?")[0].replace(/^\/api\/admin/, "") || "/";
  return raw.replace(/\/+$/, "") || "/";
}

function samePassword(sent, expected) {
  const typed = String(sent || "").trim();
  const stored = String(expected || "").trim();
  return typed.length > 0 && typed.toLowerCase() === stored.toLowerCase();
}

function adminApi() {
  return {
    name: "buyzaar-admin-api",
    configureServer(server) {
      server.middlewares.use("/api/admin", (req, res) => {
        handle(server.config.root, req, res).catch((error) => {
          send(res, 500, { error: error.message || "Admin API failed." });
        });
      });
    },
  };
}

async function handle(root, req, res) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Use POST." });
    return;
  }

  const secretFile = path.join(root, "admin.secret.json");
  if (!fs.existsSync(secretFile)) {
    fs.writeFileSync(secretFile, JSON.stringify({ password: "mirra" }, null, 2));
  }
  const secret = readJson(secretFile, { password: "mirra" });
  const body = await readBody(req);
  const url = adminPath(req);
  const sent = String(req.headers["x-admin-key"] || (url === "/login" ? body.password : "")).trim();

  if (url === "/login") {
    const ok = samePassword(sent, secret.password);
    send(res, ok ? 200 : 401, ok ? { ok: true } : { error: "Wrong password." });
    return;
  }

  if (!samePassword(sent, secret.password)) {
    send(res, 401, { error: "Wrong password." });
    return;
  }

  if (url === "/password") {
    const next = String(body.password || "").trim();
    if (next.length < 4) {
      send(res, 400, { error: "Use at least 4 characters." });
      return;
    }
    fs.writeFileSync(secretFile, JSON.stringify({ password: next }, null, 2));
    send(res, 200, { ok: true });
    return;
  }

  if (url === "/logo") {
    const match = String(body.dataUrl || "").match(
      /^data:(image\/(?:png|jpeg|webp|gif|svg\+xml))(?:;charset=[^;,]+)?;base64,([A-Za-z0-9+/=\s]+)$/,
    );
    if (!match) {
      send(res, 400, { error: "Use a PNG, JPG, WEBP, GIF, or SVG." });
      return;
    }
    const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
    if (!bytes.length || bytes.length > 2_000_000) {
      send(res, 400, { error: "Keep the logo under 2 MB." });
      return;
    }
    const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" }[match[1]];
    const dir = path.join(root, "public", "brand");
    fs.mkdirSync(dir, { recursive: true });
    const file = `logo-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(dir, file), bytes);
    send(res, 200, { url: `/brand/${file}` });
    return;
  }

  if (url === "/content") {
    if (!Array.isArray(body.tools) || !Array.isArray(body.categories)) {
      send(res, 400, { error: "The draft is missing tools or categories." });
      return;
    }
    fs.writeFileSync(path.join(root, "public", "content.json"), JSON.stringify(body, null, 2));
    send(res, 200, { ok: true });
    return;
  }

  send(res, 404, { error: "Unknown admin route." });
}

export default defineConfig({
  plugins: [react(), adminApi()],
  server: {
    host: true,
    port: 5184,
    strictPort: true,
  },
});
