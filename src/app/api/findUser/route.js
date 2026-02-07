import { NextResponse } from "next/server";
import { admin, db } from "@/utils/firebaseAdmin";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await admin.auth().verifyIdToken(token);

    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { type, value } = await req.json();

    if (!["email", "enrollment"].includes(type) || !value) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const snap = await db
      .collection("users")
      .where(type, "==", value)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const doc = snap.docs[0];

    return NextResponse.json({
      uid: doc.id,
      ...doc.data(),
    });
  } catch (err) {
    console.error("findUser error:", err);
    return NextResponse.json(
      { message: "Failed to find user" },
      { status: 500 }
    );
  }
}
