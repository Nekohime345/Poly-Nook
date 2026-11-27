import { getGoogleDriveAccessToken } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/api/google-drive/file/[id]">) {
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{10,200}$/.test(id)) return new Response("Not found", { status: 404 });

  try {
    const accessToken = await getGoogleDriveAccessToken();
    const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,size,appProperties`, {
      headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    });
    const metadata = await metadataResponse.json();
    if (!metadataResponse.ok || metadata.appProperties?.polyNook !== "model" || metadata.appProperties?.status !== "published") {
      return new Response("Not found", { status: 404 });
    }

    const range = request.headers.get("range");
    const mediaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}`, ...(range ? { Range: range } : {}) },
      cache: "no-store",
    });
    if (!mediaResponse.ok || !mediaResponse.body) return new Response("Could not load model file", { status: 502 });

    const download = new URL(request.url).searchParams.get("download") === "1";
    const filename = String(metadata.name ?? "model").replace(/[\r\n"\\]/g, "_");
    const headers = new Headers({
      "Content-Type": metadata.mimeType ?? "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    });
    const contentLength = mediaResponse.headers.get("content-length");
    const contentRange = mediaResponse.headers.get("content-range");
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);
    return new Response(mediaResponse.body, { status: mediaResponse.status, headers });
  } catch {
    return new Response("Drive storage is not connected.", { status: 503 });
  }
}
