import { NextResponse } from "next/server";
import { authAdmin } from "@/utils/firebaseAdmin";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await authAdmin.getUserByEmail(email);
    const claims = user.customClaims || {};

    return NextResponse.json({ role: claims.role || "No role assigned" });
  } catch (error) {
    console.error("Error verifying custom claim:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
