import { timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestoreDatabase, getManilaDateKey, hasFirebaseAdminConfig, isDateKey } from "@/lib/firebase-admin";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function hasValidKiteSecret(request: Request) {
  const expected = process.env.KITE_CHALLENGE_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

function serializeChallenge(data: FirebaseFirestore.DocumentData, challengeDate: string) {
  return {
    ...data,
    challengeDate,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
  };
}

export async function POST(request: Request) {
  if (!process.env.KITE_CHALLENGE_SECRET) return jsonError("Kite challenge publishing is not configured yet.", 503);
  if (!hasValidKiteSecret(request)) return jsonError("Unauthorized challenge publisher.", 401);
  if (!hasFirebaseAdminConfig()) return jsonError("Firestore server credentials are not configured yet.", 503);

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return jsonError("Send the challenge as JSON.", 400);
  }

  const challengeDate = input.challengeDate ?? getManilaDateKey();
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 120) : "";
  const prompt = typeof input.prompt === "string" ? input.prompt.trim().slice(0, 3000) : "";
  const rules = Array.isArray(input.rules)
    ? input.rules.filter((rule): rule is string => typeof rule === "string").map((rule) => rule.trim().slice(0, 300)).filter(Boolean).slice(0, 10)
    : [];
  const inspiration = typeof input.inspiration === "string" ? input.inspiration.trim().slice(0, 500) : "";

  if (!isDateKey(challengeDate)) return jsonError("challengeDate must use YYYY-MM-DD format.", 400);
  if (challengeDate !== getManilaDateKey()) return jsonError("Challenges can only be published for the current Manila date.", 400);
  if (!title || !prompt) return jsonError("A challenge needs a title and prompt.", 400);

  try {
    const database = getFirestoreDatabase();
    const reference = database.collection("challenges").doc(challengeDate);
    const result = await database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (snapshot.exists) return { created: false, challenge: serializeChallenge(snapshot.data() ?? {}, challengeDate) };

      const challenge = {
        challengeDate,
        title,
        prompt,
        rules,
        inspiration,
        status: "open",
        createdAt: FieldValue.serverTimestamp(),
      };
      transaction.create(reference, challenge);
      return { created: true, challenge: { ...challenge, createdAt: new Date().toISOString() } };
    });

    return Response.json(result, { status: result.created ? 201 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Saving daily challenge to Firestore failed", error instanceof Error ? error.message : "unknown error");
    return jsonError("Could not save the challenge. Check the Firestore server configuration.", 503);
  }
}
