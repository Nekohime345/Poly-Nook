const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function getGoogleDriveAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Drive server credentials are not configured.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const payload = await response.json();
  if (!response.ok || typeof payload.access_token !== "string") {
    throw new Error("Google Drive could not refresh its access token.");
  }

  return payload.access_token as string;
}

export function getGoogleOAuthRedirectUri() {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "http://localhost:3000/api/google-drive/callback";
}

export function hasValidSubmissionCode(value: unknown) {
  const expected = process.env.POLY_NOOK_SUBMISSION_CODE;
  if (!expected || typeof value !== "string" || value.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ value.charCodeAt(index);
  }
  return difference === 0;
}
