import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKey: Buffer.from(process.env.FIREBASE_PRIVATE_KEY, "base64").toString().replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
}

const authAdmin = admin.auth(); 
const db = admin.firestore();

export { authAdmin, rtdbAdmin, admin, db };
