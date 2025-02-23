import { NextResponse } from "next/server";
import { authAdmin } from "@/utils/firebaseAdmin"; // Import Firebase Admin SDK

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await authAdmin.getUserByEmail(email);
    await authAdmin.setCustomUserClaims(user.uid, {}); // Remove all custom claims

    return NextResponse.json({ message: "Custom claim removed successfully" });
  } catch (error) {
    console.error("Error removing custom claim:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
