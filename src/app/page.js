"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { onAuthStateChanged } from "firebase/auth";

export default function HomePage() {
  const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(auth);
  const [authChecking, setAuthChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push("/u/dashboard");
      } else {
        setAuthChecking(false);
      }
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
  );
}
