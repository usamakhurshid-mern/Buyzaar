import { json } from "../_lib.js";

export async function onRequestGet({ env }) {
  if (!env.STORE) return json(404, { error: "No saved content yet." });
  const raw = await env.STORE.get("content");
  if (!raw) return json(404, { error: "No saved content yet." });
  return new Response(raw, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
