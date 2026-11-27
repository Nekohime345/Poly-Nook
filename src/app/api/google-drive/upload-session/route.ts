import { randomUUID } from "node:crypto";
import { getGoogleDriveAccessToken, hasValidSubmissionCode } from "@/lib/google-drive";

const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".blend", ".glb"]);

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function getModelsFolderId(accessToken: string) {
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) return process.env.GOOGLE_DRIVE_FOLDER_ID;

  const query = "mimeType='application/vnd.google-apps.folder' and appProperties has { key='polyNookFolder' and value='models' } and trashed=false";
  const listParams = new URLSearchParams({ q: query, pageSize: "1", fields: "files(id)" });
  const listResponse = await fetch(`https://www.googleapis.com/drive/v3/files?${listParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const listPayload = await listResponse.json();
  if (!listResponse.ok) throw new Error(listPayload.error?.message ?? "Could not find the Poly Nook Drive folder.");
  if (typeof listPayload.files?.[0]?.id === "string") return listPayload.files[0].id as string;

  const createResponse = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Poly Nook Models",
      mimeType: "application/vnd.google-apps.folder",
      appProperties: { polyNookFolder: "models" },
    }),
    cache: "no-store",
  });
  const createPayload = await createResponse.json();
  if (!createResponse.ok || typeof createPayload.id !== "string") {
    throw new Error(createPayload.error?.message ?? "Could not create the Poly Nook Drive folder.");
  }
  return createPayload.id as string;
}

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return jsonError("Send the upload details as JSON.", 400);
  }

  if (!hasValidSubmissionCode(input.submissionCode)) return jsonError("The submission code is missing or incorrect.", 401);

  const filename = typeof input.filename === "string" ? input.filename.trim().slice(0, 180) : "";
  const extension = filename.toLowerCase().match(/\.(blend|glb)$/)?.[0] ?? "";
  const size = typeof input.size === "number" ? input.size : 0;
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 100) : "";
  const creator = typeof input.creator === "string" ? input.creator.trim().slice(0, 80) : "";
  const category = typeof input.category === "string" ? input.category.trim().slice(0, 40) : "Other";
  const description = typeof input.description === "string" ? input.description.trim().slice(0, 500) : "";
  const submissionId = typeof input.submissionId === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(input.submissionId) ? input.submissionId : randomUUID();

  if (!filename || !ALLOWED_EXTENSIONS.has(extension)) return jsonError("Only .blend and .glb files are accepted.", 400);
  if (!size || size > MAX_UPLOAD_BYTES) return jsonError("Each file must be smaller than 1 GB.", 400);
  if (!title || !creator) return jsonError("Add a model title and creator name.", 400);

  const mimeType = extension === ".glb" ? "model/gltf-binary" : "application/octet-stream";

  try {
    const accessToken = await getGoogleDriveAccessToken();
    const folderId = await getModelsFolderId(accessToken);
    const metadata = {
      name: filename.replace(/[\\/]/g, "_"),
      mimeType,
      description: `Poly Nook model: ${title} by ${creator}. ${description}`.slice(0, 1000),
      parents: [folderId],
      appProperties: {
        polyNook: "model",
        submissionId,
        role: extension === ".glb" ? "preview" : "source",
        title,
        creator,
        category,
        description: description.slice(0, 120),
        status: "uploading",
      },
    };

    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,webViewLink,appProperties", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(size),
      },
      body: JSON.stringify(metadata),
      cache: "no-store",
    });

    const uploadUrl = response.headers.get("location");
    if (!response.ok || !uploadUrl) return jsonError("Google Drive could not start the upload. Check the Drive connection and folder permissions.", 502);

    return Response.json({ uploadUrl, submissionId, role: metadata.appProperties.role }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Google Drive upload session failed", error instanceof Error ? error.message : "unknown error");
    return jsonError("Drive storage is not connected yet. Check the server environment settings.", 503);
  }
}
