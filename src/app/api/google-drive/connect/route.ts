import { randomBytes } from "node:crypto";
import { getGoogleOAuthRedirectUri } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Start the Google Drive connection from a local development session." }, { status: 404 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return Response.json({ error: "GOOGLE_CLIENT_ID is missing from .env.local." }, { status: 503 });

  const state = randomBytes(24).toString("base64url");
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleOAuthRedirectUri(),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file",
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Set-Cookie": `poly_nook_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/google-drive/callback; Max-Age=600${secure}`,
      "Cache-Control": "no-store",
    },
  });
}
