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
    let userExists = false;
    let uid = null;

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      console.log("User exists in Firebase Auth.");
      userExists = true;
      uid = userRecord.uid;
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.log("User not found in Firebase Auth.");
      } else {
        console.error("Error fetching user:", error);
        return NextResponse.json({ message: "Error checking user" }, { status: 500 });
      }
    }

    console.log("Checking Realtime Database for user...");
    const usersRef = ref(rtdb, "users");
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      console.log("User list retrieved from RTDB.");
      const users = snapshot.val();

      let userKeyToDelete = null;

      // Find the key of the user
      Object.entries(users).forEach(([key, user]) => {
        if (user.email === email) {
          userKeyToDelete = key;
        }
      });

      if (userKeyToDelete) {
        const userToDeleteRef = ref(rtdb, `users/${userKeyToDelete}`);
        await set(userToDeleteRef, null); // Deleting the user
        console.log(`User with email ${email} removed from Realtime Database.`);
      } else {
        console.log("User was not found in Realtime Database.");
      }
    } else {
      console.log("No users found in RTDB.");
    }

    // If user exists in Firebase Auth, delete them from Auth as well
    if (userExists && uid) {
      try {
        await admin.auth().deleteUser(uid);
        console.log(`User with email ${email} removed from Firebase Auth.`);
      } catch (error) {
        console.error("Error deleting user from Firebase Auth:", error);
        return NextResponse.json({ message: "Error deleting user from Firebase Auth" }, { status: 500 });
      }
    }

    return NextResponse.json({ message: `User ${email} processed successfully!` }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ message: "Failed to process request", error: error.message }, { status: 500 });
  }
}
