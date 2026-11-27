# Poly Nook

**A cozy gallery for sharing Blender creations.** Browse models, inspect their details, preview GLB files in 3D, and download the original Blender projects.

## Live demo

**[Visit Poly Nook](https://poly-nook.vercel.app/)**

The gallery is public. Model submissions are available to people with the private submission code.

## What it does

- Browse and search a curated gallery by category.
- Open a model details panel with its creator, description, category, and file information.
- Interactively preview models when a GLB preview is available.
- Download the original `.blend` project.
- Submit a `.blend` file and optional `.glb` preview through the website.
- Store submissions in Google Drive, organized into a folder for each model.

Submissions are published automatically. The owner’s Google Drive connection is used for storage; submitters do not need to connect their own Drive accounts.

## Built with

- Next.js and React
- TypeScript
- Google Drive API for model files and metadata
- Vercel for hosting
- `<model-viewer>` for interactive GLB previews

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add the required server-side values.
3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

To connect Google Drive locally, configure `http://localhost:3000/api/google-drive/callback` as an authorized redirect URI for the Google OAuth web client, start the development server, and visit [http://localhost:3000/api/google-drive/connect](http://localhost:3000/api/google-drive/connect). The callback page returns a refresh token for the server environment. Keep `.env.local` and all tokens private.

## Environment variables

Set these as server-side environment variables in Vercel. Do not prefix them with `NEXT_PUBLIC_` or commit their values.

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth web client secret |
| `GOOGLE_REFRESH_TOKEN` | Refresh token for the owner’s Drive connection |
| `POLY_NOOK_SUBMISSION_CODE` | Private code required to submit a model |
| `GOOGLE_OAUTH_REDIRECT_URI` | OAuth callback URL; local development defaults to `http://localhost:3000/api/google-drive/callback` |
| `GOOGLE_DRIVE_FOLDER_ID` | Optional ID of a Drive folder accessible to the app; leave unset to let Poly Nook create its model folders |

After changing Vercel environment variables, redeploy the project. Google OAuth apps in External Testing issue refresh tokens that expire after seven days; move the consent screen to Production for ongoing use.

## Project structure

- `src/app/page.tsx` — public gallery and model details panel
- `src/app/submit/page.tsx` — model submission form
- `src/app/api/google-drive/` — Drive connection, uploads, gallery listing, and file delivery
- `src/app/privacy/page.tsx` — privacy policy
