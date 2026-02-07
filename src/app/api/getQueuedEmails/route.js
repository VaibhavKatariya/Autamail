import { NextResponse } from "next/server";
import { db } from "@/utils/firebaseAdmin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pageSize = Number(searchParams.get("limit")) || 10;
    const cursor = searchParams.get("cursor");

    let query = db
      .collection("queuedEmails")
      .orderBy("requestedAt", "desc")
      .limit(pageSize);

    if (cursor) {
      const cursorDoc = await db.collection("queuedEmails").doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();

    const emails = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toMillis() || null,
    }));

    const nextCursor =
      snap.docs.length === pageSize
        ? snap.docs[snap.docs.length - 1].id
        : null;

    return NextResponse.json({
      emails,
      nextCursor,
    });
  } catch (err) {
    console.error("getQueuedEmails error:", err);
    return NextResponse.json(
      { message: "Failed to fetch queued emails" },
      { status: 500 }
    );
  }
}
