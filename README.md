# Poly Nook

A Next.js gallery for Blender models. Friends submit `.blend` downloads and optional `.glb` previews from `/submit`. Files and model metadata are stored in the connected Google Drive account.

## Google Drive setup

1. Create `.env.local` from `.env.example` and fill in the Web OAuth client ID and the rotated client secret. Keep this file private.
2. Set `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/google-drive/callback` locally.
3. Start the app with `npm run dev`, then visit `http://localhost:3000/api/google-drive/connect` and authorize the Google account that will own the models.
4. Copy the refresh token shown on the local callback page to `GOOGLE_REFRESH_TOKEN` in Vercel. Never add the refresh token to source control or share it in chat.
5. Set a private `POLY_NOOK_SUBMISSION_CODE` in Vercel and share it only with friends who can submit models.
6. Redeploy the Vercel app after adding environment variables.

The app requests only the `drive.file` scope and uses resumable uploads. `.blend` and `.glb` files can each be up to 1 GB. Uploaded files stay private in Drive; the site streams them for previews and downloads. Submissions publish automatically.

Google OAuth apps left in External Testing may issue refresh tokens that expire after seven days. Move the OAuth app out of Testing before relying on it long term. The gallery itself is public to anyone with its URL; the invite code only protects submissions.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
