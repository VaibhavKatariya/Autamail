"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { auth, rtdb, db } from "@/lib/firebase";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { onAuthStateChanged, deleteUser, signOut, getIdTokenResult, getIdToken } from "firebase/auth";
import { ref, get } from "firebase/database";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Added getDoc
import Link from "next/link";

export default function HomePage() {
  const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(auth);
  const [authChecking, setAuthChecking] = useState(true);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setLoadingVerification(true);
        try {
          const tokenResult = await getIdTokenResult(currentUser);
          const role = tokenResult.claims.role || null;

          const usersRef = ref(rtdb, "users");
          const snapshot = await get(usersRef);

          if (snapshot.exists()) {
            const usersList = snapshot.val();
            const usersArray = Object.values(usersList);
            const userData = usersArray.find((user) => user.email === currentUser.email);

            if (userData) {
              const userRole = userData.role;
              const { name, rollNumber } = userData;

              // Set custom claim if not already set
              if (!role) {
                await fetch("/api/setCustomClaim", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: currentUser.email, role: userRole }),
                });
                await getIdToken(currentUser, true);
              }

              // Check Firestore for existing data
              const userDocRef = doc(db, "users", currentUser.uid);
              const userDocSnap = await getDoc(userDocRef);

              if (!userDocSnap.exists() || !userDocSnap.data().name || !userDocSnap.data().rollNumber) {
                // Write to Firestore only if document doesn't exist or is missing name/rollNumber
                await setDoc(
                  userDocRef,
                  {
                    name: name || "Unknown",
                    rollNumber: rollNumber || "N/A",
                    email: currentUser.email, // Optional
                  },
                  { merge: true }
                );
                console.log("Firestore updated for user:", currentUser.uid);
              } else {
                console.log("Firestore already has user data for:", currentUser.uid);
              }

              router.push("/dashboard");
              return;
            } else {
              setShowAlert(true);
              await signOut(auth);
              await deleteUser(currentUser);
            }
          }
        } catch (err) {
          console.error("Error checking user access or interacting with Firestore:", err);
        }
        setLoadingVerification(false);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google Sign-In Error:", err);
    }
  };

  if (authChecking || loadingVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        {authChecking ? "Checking authentication..." : "Verifying your access..."}
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Access Denied</AlertDialogTitle>
            <AlertDialogDescription>
              You are not allowed to log in. Please request approval{" "}
              <Link className="underline text-blue-500" href="/requestAccess">
                here
              </Link>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAlert(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!user && (
        <div className="flex min-h-screen items-center justify-center bg-black">
          <Card className="w-[350px] bg-zinc-900 text-white border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
              <CardDescription className="text-zinc-400 text-center">Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-white hover:bg-zinc-200 text-black"
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login with Google"}
              </Button>
              {error && <p className="text-red-500 text-center mt-2">{error.message}</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}