import { NextResponse } from "next/server";
import { authAdmin } from "@/utils/firebaseAdmin"; // Import correctly

export async function POST(req) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const user = await authAdmin.getUserByEmail(email);
    await authAdmin.setCustomUserClaims(user.uid, { role });

    return NextResponse.json({ message: "Custom claim set successfully" });
  } catch (error) {
    console.error("Error setting custom claim:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}