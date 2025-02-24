import { admin } from "@/utils/firebaseAdmin";
import { rtdb } from "@/lib/firebase";
import { ref, set, get } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("API Request received...");

    const { email } = await req.json();
    console.log("Received email:", email);

    if (!email) {
      console.log("No email provided.");
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Check if Firebase Admin SDK is initialized
    if (!admin.apps.length) {
      console.error("Firebase Admin SDK not initialized.");
      return NextResponse.json({ message: "Firebase Admin SDK error" }, { status: 500 });
    }

    console.log("Checking if user exists in Firebase Auth...");
    let userExists = true;

    try {
      await admin.auth().getUserByEmail(email);
      console.log("User exists in Firebase Auth.");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.log("User not found in Firebase Auth.");
        userExists = false;
      } else {
        console.error("Error fetching user:", error);
        return NextResponse.json({ message: "Error checking user" }, { status: 500 });
      }
    }

    if (!userExists) {
      console.log("User not found in Firebase Auth. Checking Realtime Database...");
      const usersRef = ref(rtdb, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        console.log("User list retrieved from RTDB.");
        const users = snapshot.val();
        const updatedUsers = Object.values(users).filter((u) => u.email !== email);

        if (updatedUsers.length !== Object.keys(users).length) {
          await set(usersRef, updatedUsers);
          console.log("User removed from Realtime Database.");
        } else {
          console.log("User was not found in Realtime Database.");
        }
      } else {
        console.log("No users found in RTDB.");
      }
    } else {
      console.log("User exists in Firebase Auth, skipping RTDB removal.");
    }

    return NextResponse.json({ message: `User ${email} processed successfully!` }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ message: "Failed to process request", error: error.message }, { status: 500 });
  }
}
