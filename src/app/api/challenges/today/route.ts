import { getFirestoreDatabase, getManilaDateKey, hasFirebaseAdminConfig } from "@/lib/firebase-admin";

export async function GET() {
  if (!hasFirebaseAdminConfig()) return Response.json({ error: "Challenges are not connected yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const challengeDate = getManilaDateKey();
    const snapshot = await getFirestoreDatabase().collection("challenges").doc(challengeDate).get();
    if (!snapshot.exists) return Response.json({ challenge: null }, { headers: { "Cache-Control": "no-store" } });

    const data = snapshot.data() ?? {};
    return Response.json({
      challenge: {
        ...data,
        challengeDate,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Reading daily challenge from Firestore failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Challenges are not connected yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
