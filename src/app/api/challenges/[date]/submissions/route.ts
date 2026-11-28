import { getGoogleDriveAccessToken, hasValidSubmissionCode } from "@/lib/google-drive";
import { getFirestoreDatabase, getManilaDateKey, hasFirebaseAdminConfig, isDateKey } from "@/lib/firebase-admin";

const ID_PATTERN = /^[a-zA-Z0-9_-]{10,200}$/;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function getDriveSubmissionFile(accessToken: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,appProperties`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? "Could not verify the uploaded Drive file.");
  return payload;
}

export async function POST(request: Request, context: RouteContext<"/api/challenges/[date]/submissions">) {
  const { date } = await context.params;
  if (!isDateKey(date)) return jsonError("The challenge date is invalid.", 400);
  if (date !== getManilaDateKey()) return jsonError("This challenge is no longer accepting submissions.", 409);

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return jsonError("Send the submission as JSON.", 400);
  }

  if (!hasValidSubmissionCode(input.submissionCode)) return jsonError("The submission code is missing or incorrect.", 401);
  if (!hasFirebaseAdminConfig()) return jsonError("Challenge submissions are not connected yet.", 503);
  const submissionId = typeof input.submissionId === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(input.submissionId) ? input.submissionId : "";
  const sourceFileId = typeof input.sourceFileId === "string" && ID_PATTERN.test(input.sourceFileId) ? input.sourceFileId : "";
  const previewFileId = typeof input.previewFileId === "string" && ID_PATTERN.test(input.previewFileId) ? input.previewFileId : "";
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 100) : "";
  const creator = typeof input.creator === "string" ? input.creator.trim().slice(0, 80) : "";
  const category = typeof input.category === "string" ? input.category.trim().slice(0, 40) : "Other";
  const description = typeof input.description === "string" ? input.description.trim().slice(0, 500) : "";
  if (!submissionId || !sourceFileId || !title || !creator) return jsonError("The submission details are incomplete.", 400);

  try {
    const database = getFirestoreDatabase();
    const challengeReference = database.collection("challenges").doc(date);
    const challengeSnapshot = await challengeReference.get();
    if (!challengeSnapshot.exists || challengeSnapshot.data()?.status !== "open") return jsonError("This challenge is not accepting submissions.", 409);

    const accessToken = await getGoogleDriveAccessToken();
    const [sourceFile, previewFile] = await Promise.all([
      getDriveSubmissionFile(accessToken, sourceFileId),
      previewFileId ? getDriveSubmissionFile(accessToken, previewFileId) : Promise.resolve(null),
    ]);
    const validAppFile = (file: { appProperties?: Record<string, string> } | null, role: "source" | "preview") =>
      !file || (file.appProperties?.polyNook === "model" && file.appProperties?.status === "published" &&
        file.appProperties?.submissionId === submissionId && file.appProperties?.challengeDate === date && file.appProperties?.role === role);
    if (!validAppFile(sourceFile, "source") || (previewFileId && !validAppFile(previewFile, "preview"))) {
      return jsonError("The uploaded files do not match this challenge submission.", 400);
    }

    const submissionReference = challengeReference.collection("submissions").doc(submissionId);
    const submission = {
      submissionId,
      challengeDate: date,
      title,
      creator,
      category,
      description,
      sourceFileId,
      ...(previewFileId ? { previewFileId } : {}),
      submittedAt: new Date(),
    };
    await submissionReference.create(submission);
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code === 6 || code === "already-exists") return jsonError("This model has already been submitted to this challenge.", 409);
    console.error("Saving challenge submission failed", error instanceof Error ? error.message : "unknown error");
    return jsonError("Could not add the model to the challenge. The uploaded files may still be in Drive.", 503);
  }
}
