// src/app/api/reviewQueuedEmails/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { admin, db } from "@/utils/firebaseAdmin";
import crypto from "crypto";

function hashEmail(email) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

async function sendZeptoTemplate({ to, name, templateKey }) {
  const res = await fetch("https://api.zeptomail.in/v1.1/email/template", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Zoho-enczapikey ${process.env.ZEPTOMAIL_API_KEY}`,
    },
    body: JSON.stringify({
      mail_template_key: templateKey,
      from: {
        address: "noreply@mail.gdg-jiit.com",
        name: "GDG JIIT 128",
      },
      to: [
        {
          email_address: {
            address: to,
            name: name || "",
          },
        },
      ],
      merge_info: { name: name || "" },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "ZeptoMail failed");

  return { requestId: data.request_id };
}

export async function POST(req) {
  try {
    const { action, queueIds } = await req.json();

    if (
      !["approve", "reject"].includes(action) ||
      !Array.isArray(queueIds) ||
      queueIds.length === 0 ||
      queueIds.length > 10
    ) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const batch = db.batch();
    const sent = [];
    const rejected = [];
    const failed = [];

    for (const id of queueIds) {
      const ref = db.collection("queuedEmails").doc(id);
      const snap = await ref.get();
      if (!snap.exists) continue;

      const data = snap.data();

      // REJECT
      if (action === "reject") {
        batch.delete(ref);
        batch.set(
          db.collection("emailIndex").doc(hashEmail(data.email)),
          {
            status: "rejected",
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        rejected.push(data.email);
        continue;
      }

      try {
        const { requestId } = await sendZeptoTemplate({
          to: data.email,
          name: data.name,
          templateKey:
            "2518b.1a7166b5dcc9c599.k1.65a05bf1-fa93-11f0-bf95-8e9a6c33ddc2.19bf97aef2c",
        });

        const uid = data.requestedBy;
        if (!uid) throw new Error("Missing requestedBy uid");

        const sentRef = db.collection("sentEmails").doc();

        batch.set(sentRef, {
          ...data,
          status: "sent",
          requestId,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        batch.set(db.doc(`users/${uid}/sentEmailRefs/${sentRef.id}`), {
          status: "sent",
          requestId,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        batch.delete(ref);

        batch.set(
          db.collection("emailIndex").doc(hashEmail(data.email)),
          {
            status: "sent",
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        sent.push(data.email);
      } catch (err) {
        // ✅ Clean up failed email from queue
        batch.delete(ref);

        batch.set(
          db.collection("emailIndex").doc(hashEmail(data.email)),
          {
            status: "failed",
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            error: err.message,
          },
          { merge: true },
        );

        failed.push({ email: data.email, reason: err.message });
      }
    }

    await batch.commit();

    return NextResponse.json({
      message: "Review completed",
      sentCount: sent.length,
      rejectedCount: rejected.length,
      failedCount: failed.length,
      failed,
    });
  } catch (err) {
    console.error("reviewQueuedEmails error:", err);
    return NextResponse.json(
      { message: "Failed to process queued emails" },
      { status: 500 },
    );
  }
}
