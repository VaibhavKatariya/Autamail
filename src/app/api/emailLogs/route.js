import { NextResponse } from "next/server";
import { admin, db } from "@/utils/firebaseAdmin";

const PAGE_SIZE = 10;

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await admin.auth().verifyIdToken(token);

    const uid = decoded.uid;
    const isAdmin = decoded.role === "admin";

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");

    let emails = [];
    let nextCursor = null;

    if (isAdmin) {
      let query = db
        .collection("sentEmails")
        .orderBy("sentAt", "desc")
        .limit(PAGE_SIZE);

      if (cursor) {
        const cursorDoc = await db.collection("sentEmails").doc(cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      const snap = await query.get();

      emails = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toMillis() || null,
        sentAt: doc.data().sentAt?.toMillis() || null,
      }));

      nextCursor =
        snap.docs.length === PAGE_SIZE
          ? snap.docs[snap.docs.length - 1].id
          : null;

      return NextResponse.json({ emails, nextCursor });
    }

    let refQuery = db
      .collection(`users/${uid}/sentEmailRefs`)
      .orderBy("sentAt", "desc")
      .limit(PAGE_SIZE);

    if (cursor) {
      const cursorDoc = await db
        .collection(`users/${uid}/sentEmailRefs`)
        .doc(cursor)
        .get();

      if (cursorDoc.exists) {
        refQuery = refQuery.startAfter(cursorDoc);
      }
    }

    const refSnap = await refQuery.get();
    const ids = refSnap.docs.map((d) => d.id);

    if (ids.length === 0) {
      return NextResponse.json({ emails: [], nextCursor: null });
    }

    const emailDocs = await Promise.all(
      ids.map((id) => db.collection("sentEmails").doc(id).get())
    );

    emails = emailDocs
      .filter((d) => d.exists)
      .map((d) => ({
        id: d.id,
        ...d.data(),
        requestedAt: d.data().requestedAt?.toMillis() || null,
        sentAt: d.data().sentAt?.toMillis() || null,
      }));

    nextCursor =
      refSnap.docs.length === PAGE_SIZE
        ? refSnap.docs[refSnap.docs.length - 1].id
        : null;

    return NextResponse.json({ emails, nextCursor });
  } catch (err) {
    console.error("emailLogs error:", err);
    return NextResponse.json(
      { message: "Failed to fetch email logs" },
      { status: 500 }
    );
  }
}
