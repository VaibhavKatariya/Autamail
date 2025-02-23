"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useAuth(); // Use AuthContext
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/u/dashboard");
    }
  }, [user, router]);

  if (loading) {
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
              onClick={signInWithGoogle}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login with Google"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
