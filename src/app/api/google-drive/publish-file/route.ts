import { getGoogleDriveAccessToken, hasValidSubmissionCode } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Send a file ID and submission code." }, { status: 400 });
  }

  if (!hasValidSubmissionCode(input.submissionCode)) return Response.json({ error: "The submission code is missing or incorrect." }, { status: 401 });
  if (typeof input.fileId !== "string" || !/^[a-zA-Z0-9_-]{10,200}$/.test(input.fileId)) return Response.json({ error: "Invalid Drive file ID." }, { status: 400 });

  try {
    const accessToken = await getGoogleDriveAccessToken();
    const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.fileId)}?fields=id,appProperties`, {
      headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    });
    const file = await fileResponse.json();
    if (!fileResponse.ok || file.appProperties?.polyNook !== "model") return Response.json({ error: "This file is not a Poly Nook submission." }, { status: 404 });

    const updateResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.fileId)}?fields=id,appProperties`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ appProperties: { ...file.appProperties, status: "published" } }),
      cache: "no-store",
    });
    if (!updateResponse.ok) return Response.json({ error: "Drive uploaded the file but could not publish it in the gallery." }, { status: 502 });

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not finish publishing this Drive file." }, { status: 503 });
  }
}
