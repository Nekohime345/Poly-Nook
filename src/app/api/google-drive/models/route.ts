import { getGoogleDriveAccessToken } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET() {
  try {
    const accessToken = await getGoogleDriveAccessToken();
    const query = "appProperties has { key='polyNook' and value='model' } and appProperties has { key='status' and value='published' } and trashed=false";
    const params = new URLSearchParams({
      q: query,
      orderBy: "createdTime desc",
      pageSize: "1000",
      fields: "files(id,name,mimeType,size,createdTime,appProperties)",
    });
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) return Response.json({ error: "Could not read Poly Nook models from Drive." }, { status: 502 });

    const models = new Map<string, { id: string; title: string; creator: string; category: string; description: string; createdAt: string; previewId?: string; downloadId?: string; fileSize?: string }>();
    for (const file of payload.files ?? []) {
      const properties = file.appProperties ?? {};
      const submissionId = properties.submissionId;
      if (typeof submissionId !== "string") continue;
      const model = models.get(submissionId) ?? {
        id: submissionId,
        title: properties.title ?? "Untitled model",
        creator: properties.creator ?? "Poly Nook artist",
        category: properties.category ?? "Other",
        description: properties.description ?? "",
        createdAt: file.createdTime ?? "",
      };
      if (properties.role === "preview") model.previewId = file.id;
      if (properties.role === "source") {
        model.downloadId = file.id;
        model.fileSize = file.size ? `${(Number(file.size) / (1024 * 1024)).toFixed(1)} MB` : "";
      }
      models.set(submissionId, model);
    }

    return Response.json({ models: Array.from(models.values()).map((model) => ({
      ...model,
      previewUrl: model.previewId ? `/api/google-drive/file/${encodeURIComponent(model.previewId)}` : undefined,
      downloadUrl: model.downloadId ? `/api/google-drive/file/${encodeURIComponent(model.downloadId)}?download=1` : undefined,
    })) }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return Response.json({ error: "Drive storage is not connected yet." }, { status: 503 });
  }
}
