"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [signInWithGoogle, signingIn, error] = useSignInWithGoogle(auth);

  // 🔁 Redirect logged-in users
  if (!loading && user) {
    router.replace("/dashboard");
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google Sign-In failed:", err);
    }
  };

  // ⏳ Global loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Checking authentication...
      </div>
    );
  }

  // 👤 Not logged in → show login
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Card className="w-[350px] bg-zinc-900 text-white border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Autamail
          </CardTitle>
          <CardDescription className="text-zinc-400 text-center">
            Sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full bg-white hover:bg-zinc-200 text-black"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
          >
            {signingIn ? "Signing in..." : "Login with Google"}
          </Button>

          {error && (
            <p className="text-red-500 text-center mt-2">
              {error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
