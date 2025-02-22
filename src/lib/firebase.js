import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyD7CXwBAen72cnja7L2hr0jRig88-u8FYU",
  authDomain: "supplysync-gdsc.firebaseapp.com",
  projectId: "supplysync-gdsc",
  storageBucket: "supplysync-gdsc.firebasestorage.app",
  messagingSenderId: "158982485508",
  appId: "1:158982485508:web:22fad985f2ab30f7dda751"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app)
const db = getFirestore(app);

export {app, auth, db}