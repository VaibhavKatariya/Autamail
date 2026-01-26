"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import BlockedUserOverlay from "@/components/BlockedUserOverlay";
import AccessRequestFormSkeleton from "@/components/skeletonUI/requestAccessSkeleton";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function RequestAccessPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [showBlockedOverlay, setShowBlockedOverlay] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Redirect rules
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    if (role) {
      router.replace("/dashboard");
    }
  }, [user, role, loading, router]);

  if (loading) {
    return <AccessRequestFormSkeleton />;
  }

  if (!user || role) return null;

  const email = user.email || "";
  const isCollegeEmail = email.endsWith("@mail.jiit.ac.in");
  const enrollment = email.split("@")[0];

  const handleConfirm = async () => {
    if (!isCollegeEmail) {
      setShowBlockedOverlay(true);
      return;
    }

    try {
      setProcessing(true);

      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email,
          name: user.displayName || "",
          enrollment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Request failed");
        return;
      }

      toast.success("Access request submitted successfully");
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  const handleOk = async () => {
    await signOut(auth);    
  };

  return (
    <>
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>
              {submitted ? "Request Submitted" : "Confirm your details"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {!submitted ? (
              <>
                <p><b>Name:</b> {user.displayName}</p>
                <p><b>Email:</b> {email}</p>
                <p><b>Enrollment:</b> {enrollment}</p>

                <Button
                  className="w-full"
                  onClick={handleConfirm}
                  disabled={processing}
                >
                  {processing ? "Submitting..." : "Confirm Details"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400">
                  Your request has been sent to the admins.
                  You’ll get access once it’s approved.
                </p>

                <Button className="w-full" onClick={handleOk}>
                  OK
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {showBlockedOverlay && <BlockedUserOverlay />}
    </>
  );
}
