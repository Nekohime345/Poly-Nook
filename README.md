# Poly Nook

A Next.js gallery starter for sharing Blender models. The current page includes sample gallery content, category filters, search, and responsive layouts.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Planned file and data setup

- **Firestore** stores each model's title, creator, description, category, and object paths.
- **Cloudflare R2** stores the downloadable `.blend` file and web preview `.glb` file.
- The browser can load a `.glb` preview and link to the original `.blend` download.

Copy `.env.example` to `.env.local` and add Firebase web app values and the public R2 base URL when those services are configured. The sample models are currently local demo content; no cloud credentials or real model files are connected yet.

Keep R2 credentials private. Only a public delivery URL belongs in `NEXT_PUBLIC_R2_PUBLIC_URL`; upload credentials should be used from a trusted local or server environment and never exposed in browser code.
