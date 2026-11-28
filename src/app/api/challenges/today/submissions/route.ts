import { getFirestoreDatabase, getManilaDateKey, hasFirebaseAdminConfig } from "@/lib/firebase-admin";

export async function GET() {
  if (!hasFirebaseAdminConfig()) return Response.json({ error: "Challenge submissions are not connected yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const challengeDate = getManilaDateKey();
    const snapshot = await getFirestoreDatabase()
      .collection("challenges").doc(challengeDate)
      .collection("submissions").orderBy("submittedAt", "desc").limit(100).get();
    const submissions = snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        title: data.title,
        creator: data.creator,
        category: data.category,
        description: data.description,
        sourceFileId: data.sourceFileId,
        previewFileId: data.previewFileId,
        submittedAt: data.submittedAt?.toDate?.().toISOString() ?? null,
      };
    });
    return Response.json({ submissions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Reading challenge submissions failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Challenge submissions are not connected yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
