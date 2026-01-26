import { admin } from "@/utils/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    let userRecord;

    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return NextResponse.json(
          { message: "User already deleted" },
          { status: 200 }
        );
      }
      throw error;
    }

    await admin.auth().deleteUser(userRecord.uid);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("delete-user error:", error);

    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
