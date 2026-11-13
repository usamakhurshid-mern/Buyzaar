# Buyzaar

A free desk of calculators and short guides. Visitors type their own numbers. The maths stays in the browser.

```bash
npm install
npm run dev
```

Open the site at http://127.0.0.1:5184/ and the editor at http://127.0.0.1:5184/admin.

The starter admin password is `buyzaar`. Change it inside Brand.

Local sign-in uses `admin.secret.json` on this computer. That file is gitignored and is not the live password.

The live site checks a KV key named `password`, then the Cloudflare secret `ADMIN_PASSWORD`, and only then the starter fallback. Set the live password with `npx wrangler secret put ADMIN_PASSWORD`. A value already stored at the KV key wins over that secret.

Ads are optional embeds you paste and place in the page. The site does not click them.
