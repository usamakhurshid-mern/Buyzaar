# Buyzaar

A free desk of calculators and short guides. Visitors type their own numbers. The maths stays in the browser.

```bash
npm install
npm run dev
```

Open the site at http://127.0.0.1:5184/ and the editor at http://127.0.0.1:5184/admin.

The starter admin password is `mirra`. Local sign-in reads gitignored `admin.secret.json` and never uploads it. The live Worker checks the KV key `password`, then the secret `ADMIN_PASSWORD`, and only then `mirra`. Set the live password with `npx wrangler secret put ADMIN_PASSWORD`. If the KV key already exists, it wins.

Ads are optional embeds you paste and place in the page. The site does not click them.
