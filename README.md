# Buyzaar

A free desk of calculators and short guides. Visitors type their own numbers. The maths stays in the browser.

```bash
npm install
npm run dev
```

Open the site at http://127.0.0.1:5184/ and the editor at http://127.0.0.1:5184/admin.

The starter admin password is `buyzaar`. Change it inside Brand.

Locally, `npm run dev` has to be running for sign-in and Save. Saving writes `public/content.json`, and that file is what the site renders.

On Cloudflare Pages the same admin uses the `functions` API. Create a KV namespace, then in the Pages project open Settings → Functions → KV namespace bindings and bind it as `BUYZAAR`. Until that binding exists, the sign-in form explains what is missing. The first Save stores the live site in that namespace.

Ads are optional embeds you paste and place in the page. The site does not click them.
