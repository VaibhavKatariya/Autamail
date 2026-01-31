import { NextResponse } from "next/server";
import { admin, db } from "@/utils/firebaseAdmin";
import crypto from "crypto";
function hashEmail(email) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

/**
 * POST /api/queueEmails
 *
 * Body:
 * {
 *   entries: [{ email, name }],
 *   template: string,
 *   fromEmail: string,
 *   uid: string
 * }
 */
export async function POST(req) {
  try {
    const { entries, template, fromEmail, uid } = await req.json();

    console.log(entries, uid, template, fromEmail);

    if (!uid || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { message: "Invalid payload" },
        { status: 400 }
      );
    }

    if (!template || !fromEmail) {
      return NextResponse.json(
        { message: "Template and fromEmail are required" },
        { status: 400 }
      );
    }

    const batch = db.batch();

    const queued = [];
    const skipped = [];

    // 1 Deduplicate emails inside request itself
    const uniqueMap = new Map();
    for (const e of entries) {
      const email = e.email?.toLowerCase().trim();
      if (!email) continue;
      if (!uniqueMap.has(email)) {
        uniqueMap.set(email, e.name || "");
      }
    }

    const uniqueEmails = Array.from(uniqueMap.entries());

    // 2 Check emailIndex (O(1) reads)
    const indexChecks = await Promise.all(
      uniqueEmails.map(async ([email]) => {
        const ref = db.collection("emailIndex").doc(hashEmail(email));
        const snap = await ref.get();
        return { email, exists: snap.exists, data: snap.data() };
      })
    );

    // 3 Process results
    for (const check of indexChecks) {
      if (check.exists) {
        skipped.push({
          email: check.email,
          status: check.data?.status || "unknown",
        });
        continue;
      }

      const docRef = db.collection("queuedEmails").doc();

      const payload = {
        email: check.email,
        name: uniqueMap.get(check.email),
        template,
        fromEmail,
        status: "queued",
        requestedBy: uid,
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // queuedEmails
      batch.set(docRef, payload);

      // emailIndex
      batch.set(
        db.collection("emailIndex").doc(hashEmail(check.email)),
        {
          email: check.email,
          status: "queued",
          source: "queuedEmails",
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      queued.push(check.email);
    }

    
    if (queued.length > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      message: "Queue processing completed",
      queuedCount: queued.length,
      skippedCount: skipped.length,
      queued,
      skipped,
    });
  } catch (err) {
    console.error("queueEmails error:", err);
    return NextResponse.json(
      { message: "Failed to queue emails" },
      { status: 500 }
    );
  }
}
