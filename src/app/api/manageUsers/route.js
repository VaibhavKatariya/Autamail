import { NextResponse } from "next/server";
import { admin, db } from "@/utils/firebaseAdmin";

/**
 * GET /api/manageUsers?pageToken?
 * Returns pending users (paginated, 10 per page)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get("pageToken");

    let query = db
      .collection("pendingUsers")
      .orderBy("requestedAt", "desc")
      .limit(10);

    if (pageToken) {
      const lastDoc = await db
        .collection("pendingUsers")
        .doc(pageToken)
        .get();

      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snap = await query.get();

    const users = snap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    const nextPageToken =
      snap.docs.length === 10
        ? snap.docs[snap.docs.length - 1].id
        : null;

    return NextResponse.json({ users, nextPageToken });
  } catch (err) {
    console.error("GET pending users error:", err);
    return NextResponse.json(
      { message: "Failed to fetch pending users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manageUsers
 * Body:
 * {
 *   action: "approve" | "disapprove",
 *   uid: string,
 *   reason?: string
 * }
 */
export async function POST(req) {
  try {
    const { action, uid, reason } = await req.json();

    if (!action || !uid) {
      return NextResponse.json(
        { message: "Invalid payload" },
        { status: 400 }
      );
    }

    const pendingRef = db.collection("pendingUsers").doc(uid);
    const snap = await pendingRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { message: "Pending user not found" },
        { status: 404 }
      );
    }

    const data = snap.data();

    if (action === "approve") {
      // 1️⃣ Create user doc
      await db.collection("users").doc(uid).set({
        uid,
        email: data.email,
        name: data.name,
        enrollment: data.enrollment,
        role: "user",
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2️⃣ Set custom claim
      await admin.auth().setCustomUserClaims(uid, { role: "user" });

      // 3️⃣ Remove from pending
      await pendingRef.delete();

      return NextResponse.json({ message: "User approved" });
    }

    if (action === "disapprove") {
      // Optional: send email here using ZeptoMail later

      await pendingRef.delete();

      return NextResponse.json({
        message: "User disapproved",
        reason: reason || null,
      });
    }

    return NextResponse.json(
      { message: "Invalid action" },
      { status: 400 }
    );
  } catch (err) {
    console.error("POST manageUsers error:", err);
    return NextResponse.json(
      { message: "Action failed" },
      { status: 500 }
    );
  }
}
