import { NextResponse } from "next/server";
import { authAdmin } from "@/utils/firebaseAdmin";

export async function POST(req) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Ensure the role is either "member" or "admin" to prevent unauthorized roles
    if (!["member", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await authAdmin.getUserByEmail(email);
    await authAdmin.setCustomUserClaims(user.uid, { role });

    return NextResponse.json({ message: `User assigned role: ${role} successfully` });
  } catch (error) {
    console.error("Error setting custom claim:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
