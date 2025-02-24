import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // ✅ Allow requests from any domain
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle preflight CORS request
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req) {
  try {
    const data = await req.json();
    console.log("📩 Incoming Webhook Request:", JSON.stringify(data, null, 2));

    const eventData = data["event-data"];
    if (!eventData) {
      console.error("❌ Missing event-data in webhook");
      return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders });
    }

    const event = eventData.event; // Example: "failed", "delivered", "opened"
    const docId = eventData["user-variables"]?.docId; // Firestore doc ID sent with the email

    if (!docId) {
      console.error(`❌ Missing Firestore doc ID for event: ${event}`);
      return NextResponse.json({ error: "Missing Firestore doc ID" }, { status: 400, headers: corsHeaders });
    }

    // Determine email status
    let status = "pending"; // Default
    if (event === "failed") status = "failed";
    else if (event === "delivered") status = "sent";
    else if (event === "opened") status = "opened";
    else if (event === "clicked") status = "clicked";

    console.log(`🔄 Updating Firestore doc ${docId} with status: ${status}`);

    // Update Firestore document status
    const emailDocRef = doc(db, "sentEmails", docId);
    await updateDoc(emailDocRef, { status });

    console.log(`✅ Firestore updated: doc ${docId} -> ${status}`);

    return NextResponse.json({ success: true, message: `Email status updated to ${status}.` }, { headers: corsHeaders });
  } catch (error) {
    console.error("❌ Webhook Processing Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}
