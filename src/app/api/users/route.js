import { NextResponse } from "next/server";
import { admin } from "@/utils/firebaseAdmin";

const PAGE_SIZE = 10;

/**
 * GET /api/users?page=1
 * Returns paginated users from Firestore
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);

    const usersRef = admin.firestore().collection("users");
    let query = usersRef
      .orderBy("approvedAt", "desc")
      .limit(PAGE_SIZE);

    if (page > 1) {
      const offsetSnap = await usersRef
        .orderBy("approvedAt", "desc")
        .limit((page - 1) * PAGE_SIZE)
        .get();

      const lastDoc = offsetSnap.docs[offsetSnap.docs.length - 1];
      if (lastDoc) query = query.startAfter(lastDoc);
    }

    const snap = await query.get();

    const users = snap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      users,
      hasMore: users.length === PAGE_SIZE,
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * body:
 *  - { action: "change-role", uid, role }
 *  - { action: "delete", uid }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "change-role") {
      const { uid, role } = body;

      if (!uid || !["admin", "user"].includes(role)) {
        return NextResponse.json(
          { message: "Invalid role change request" },
          { status: 400 }
        );
      }

      // Update custom claim
      await admin.auth().setCustomUserClaims(uid, { role });

      // Update Firestore
      await admin.firestore().collection("users").doc(uid).update({
        role,
      });

      return NextResponse.json({ message: "Role updated" });
    }

    if (action === "delete") {
      const { uid } = body;

      if (!uid) {
        return NextResponse.json(
          { message: "UID is required" },
          { status: 400 }
        );
      }

      // Delete from Auth
      await admin.auth().deleteUser(uid);

      // Delete Firestore doc
      await admin.firestore().collection("users").doc(uid).delete();

      return NextResponse.json({ message: "User deleted" });
    }

    return NextResponse.json(
      { message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { message: "Operation failed" },
      { status: 500 }
    );
  }
}
