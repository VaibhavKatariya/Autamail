import { NextResponse } from "next/server";
import { db } from "@/utils/firebaseAdmin";
import mailgun from "mailgun.js";
const Mailgun = require("mailgun.js");
const formData = require("form-data");

export async function POST(request) {
    try {
        const { emailIds } = await request.json();

        if (!emailIds || !Array.isArray(emailIds)) {
            return NextResponse.json({ error: "Invalid email IDs" }, { status: 400 });
        }

        if (!process.env.NEXT_PUBLIC_MAILGUN_API_KEY || !process.env.NEXT_PUBLIC_MAILGUN_DOMAIN) {
            throw new Error("Mailgun API key or domain is missing from environment variables");
        }

        if (!process.env.BASE_URL) {
            throw new Error("BASE_URL is missing from environment variables");
        }

        const mg = new Mailgun(formData).client({
            username: "api",
            key: process.env.NEXT_PUBLIC_MAILGUN_API_KEY,
            url: "https://api.eu.mailgun.net",
        });

        const failedEmails = [];

        const sendPromises = emailIds.map(async (id) => {
            const queuedDocRef = db.collection("queuedEmails").doc(id);
            const docSnap = await queuedDocRef.get();
            if (!docSnap.exists) return;

            const emailData = docSnap.data();

            const data = {
                from: "GDG JIIT admin@gdg-jiit.com",
                to: emailData.email.toLowerCase(),
                template: emailData.template,
                "h:X-Mailgun-Variables": JSON.stringify({ name: emailData.name })
            };

            try {
                const result = await mg.messages.create(process.env.NEXT_PUBLIC_MAILGUN_DOMAIN, data);

                const updatedData = {
                    ...emailData,
                    status: "sent",
                    messageId: result.id,
                    sentAt: new Date().toISOString(),
                };

                // Use full URL with BASE_URL
                const setGlobalLog = await fetch(`${process.env.BASE_URL}/api/setEmailLog`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ docId: id, collectionName: "sentEmails", data: updatedData }),
                });

                if (setGlobalLog.ok) {
                    await fetch(`${process.env.BASE_URL}/api/setEmailLog`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            docId: id,
                            collectionName: `users/${emailData.uid}/sentEmails`,
                            data: updatedData,
                        }),
                    });

                    await queuedDocRef.delete();
                } else {
                    console.error(`Failed to log global email ${id}:`, globalLogData);
                    failedEmails.push(emailData);
                }
            } catch (error) {
                console.error(`Failed to send email ${id}:`, error);
                failedEmails.push(emailData);
            }
        });

        await Promise.all(sendPromises);

        if (failedEmails.length > 0) {
            return NextResponse.json(
                { message: "Some emails failed to send", failedEmails },
                { status: 207 }
            );
        }

        return NextResponse.json({ message: "Emails sent successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error sending emails:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}