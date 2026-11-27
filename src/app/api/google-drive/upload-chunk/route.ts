import { getGoogleDriveAccessToken, hasValidSubmissionCode } from "@/lib/google-drive";

const MAX_CHUNK_BYTES = 4 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!hasValidSubmissionCode(request.headers.get("x-poly-nook-submission-code"))) {
    return jsonError("The submission code is missing or incorrect.", 401);
  }

  const sessionValue = request.headers.get("x-poly-nook-upload-url");
  const contentRange = request.headers.get("content-range") ?? "";
  let sessionUrl: URL;
  try {
    sessionUrl = new URL(sessionValue ?? "");
  } catch {
    return jsonError("The Drive upload session is invalid. Please start the upload again.", 400);
  }

  if (
    sessionUrl.protocol !== "https:" ||
    sessionUrl.hostname !== "www.googleapis.com" ||
    sessionUrl.pathname !== "/upload/drive/v3/files" ||
    sessionUrl.searchParams.get("uploadType") !== "resumable" ||
    !sessionUrl.searchParams.has("upload_id")
  ) {
    return jsonError("The Drive upload session is invalid. Please start the upload again.", 400);
  }

  const range = contentRange.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
  if (!range) return jsonError("The upload chunk range is invalid.", 400);
  const start = Number(range[1]);
  const end = Number(range[2]);
  const total = Number(range[3]);
  const expectedChunkSize = end - start + 1;
  if (
    !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || !Number.isSafeInteger(total) ||
    start < 0 || end < start || total < 1 || total > MAX_UPLOAD_BYTES ||
    expectedChunkSize > MAX_CHUNK_BYTES || end >= total
  ) {
    return jsonError("The upload chunk range is invalid.", 400);
  }

  try {
    const chunk = await request.arrayBuffer();
    if (chunk.byteLength !== expectedChunkSize) return jsonError("The upload chunk size did not match its range.", 400);

    const accessToken = await getGoogleDriveAccessToken();
    const response = await fetch(sessionUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Content-Length": String(chunk.byteLength),
        "Content-Range": contentRange,
      },
      body: chunk,
      cache: "no-store",
    });

    if (response.status === 308) {
      return Response.json({ complete: false }, { headers: { "Cache-Control": "no-store" } });
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload.id !== "string") {
      console.error("Google Drive chunk upload failed", response.status, payload.error?.message ?? "unknown error");
      return jsonError(payload.error?.message ?? "Google Drive could not finish the upload.", 502);
    }

    return Response.json({ complete: true, id: payload.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Google Drive chunk upload failed", error instanceof Error ? error.message : "unknown error");
    return jsonError("Could not send this upload chunk to Google Drive. Please retry the upload.", 502);
  }
}
