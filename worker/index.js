import { onRequestGet as published } from "../functions/api/content.js";
import { onRequestPost as saveContent } from "../functions/api/admin/content.js";
import { onRequestPost as login } from "../functions/api/admin/login.js";
import { onRequestPost as logo } from "../functions/api/admin/logo.js";
import { onRequestPost as password } from "../functions/api/admin/password.js";
import { json } from "../functions/_lib.js";

const posts = {
  "/api/admin/login": login,
  "/api/admin/password": password,
  "/api/admin/logo": logo,
  "/api/admin/content": saveContent,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/content") {
      if (request.method !== "GET") return json(405, { error: "Use GET." });
      return published({ request, env });
    }
    const handler = posts[url.pathname];
    if (handler) {
      if (request.method !== "POST") return json(405, { error: "Use POST." });
      return handler({ request, env });
    }
    if (url.pathname.startsWith("/api/")) return json(404, { error: "The live admin API failed." });
    return env.ASSETS.fetch(request);
  },
};
