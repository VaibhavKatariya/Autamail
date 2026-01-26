import { NextResponse } from "next/server";
import { db } from "@/utils/firebaseAdmin";

export async function POST(req) {
  try {
    const { uid, email, name, enrollment } = await req.json();

    if (!uid || !email || !enrollment) {
      return NextResponse.json(
        { status: "invalid_payload" },
        { status: 400 }
      );
    }

    if (!email.endsWith("@mail.jiit.ac.in")) {
      return NextResponse.json(
        { status: "invalid_domain" },
        { status: 403 }
      );
    }

    const derivedEnrollment = email.split("@")[0];
    if (derivedEnrollment !== enrollment) {
      return NextResponse.json(
        { status: "invalid_payload" },
        { status: 400 }
      );
    }

    const ref = db.collection("pendingUsers").doc(uid);
    const snap = await ref.get();

    if (snap.exists) {
      return NextResponse.json(
        { status: "duplicate" },
        { status: 200 }
      );
    }

    await ref.set({
      uid,
      email,
      name: name || null,
      enrollment,
      status: "pending",
      requestedAt: new Date(),
    });

    return NextResponse.json(
      { status: "created" },
      { status: 201 }
    );
  } catch (err) {
    console.error("request-access error:", err);
    return NextResponse.json(
      { status: "error" },
      { status: 500 }
    );
  }
}
