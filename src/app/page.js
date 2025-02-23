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
import { auth, rtdb } from "@/lib/firebase";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { onAuthStateChanged, deleteUser, signOut, getIdTokenResult, getIdToken } from "firebase/auth";
import { ref, get } from "firebase/database";

export default function HomePage() {
  const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(auth);
  const [authChecking, setAuthChecking] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const tokenResult = await getIdTokenResult(currentUser);
          const role = tokenResult.claims.role || null; // Check if user already has a role

          if (role === "admin") {
            // If the user is already an admin, let them in
            router.push("/u/dashboard");
            return;
          }

          const usersRef = ref(rtdb, "users");
          const snapshot = await get(usersRef);

          if (snapshot.exists()) {
            const usersList = snapshot.val();
            if (usersList.includes(currentUser.email)) {
              if (!role) {
                // Assign 'member' role ONLY if the user has no role
                await fetch("/api/setCustomClaim", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: currentUser.email, role: "member" }),
                });

                // Refresh token to get updated claims
                await getIdToken(currentUser, true);
              }

              router.push("/u/dashboard");
            } else {
              setShowAlert(true);
              await signOut(auth);
              await deleteUser(currentUser);
            }
          }
        } catch (err) {
          console.error("Error checking user access:", err);
        }
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

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Checking authentication...
      </div>
    );
  }

  return (
    <>
      {/* Alert Dialog for Unauthorized Users */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Access Denied</AlertDialogTitle>
            <AlertDialogDescription>
              You are not allowed to log in. Please get approval from the admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAlert(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Login Page */}
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
    </>
  );
}
