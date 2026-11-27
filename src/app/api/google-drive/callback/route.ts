import { getGoogleOAuthRedirectUri } from "@/lib/google-drive";

function page(message: string, status = 200) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Poly Nook Drive setup</title><body style="font:16px system-ui;max-width:720px;margin:48px auto;padding:0 20px;line-height:1.6"><h1>Poly Nook Drive setup</h1>${message}</body></html>`, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" },
  });
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") return page("Run this setup locally from your own computer.", 404);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.headers.get("cookie")?.match(/(?:^|;\s*)poly_nook_oauth_state=([^;]+)/)?.[1];
  if (!code || !state || !expectedState || state !== expectedState) return page("The authorization response could not be verified. Start again from <a href='/api/google-drive/connect'>Connect Drive</a>.", 400);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return page("Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your local .env.local file, then restart the dev server.", 503);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleOAuthRedirectUri(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok || typeof tokens.refresh_token !== "string") {
    return page("Google did not return a refresh token. Start again; if you already authorized this app, remove its access from your Google Account and reconnect.", 400);
  }

  const refreshToken = tokens.refresh_token as string;
  return page(`<p>Drive is authorized. Copy the token below into the <code>GOOGLE_REFRESH_TOKEN</code> environment variable in Vercel. This page only works in your local development server.</p><p><textarea readonly rows="4" style="width:100%;font:13px monospace" onclick="this.select()">${refreshToken.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</textarea></p><p>Keep this token private. After adding it to Vercel, redeploy the site.</p>`, 200);
}
