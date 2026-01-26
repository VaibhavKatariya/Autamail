"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function RequestAccessPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [showBlockedPopup, setShowBlockedPopup] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [processing, setProcessing] = useState(false);

  // Redirect rules
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/");
    if (role) router.replace("/dashboard");
  }, [user, role, loading, router]);

  if (loading || !user || role) return null;

  const email = user.email || "";
  const isCollegeEmail = email.endsWith("@mail.jiit.ac.in");

  const enrollment = email.split("@")[0]; // 9923xxxxx

  const handleConfirm = async () => {
    if (!isCollegeEmail) {
      setShowBlockedPopup(true);
      toast.error("Please use your @mail.jiit.ac.in email");

      let seconds = 5;
      const interval = setInterval(() => {
        seconds -= 1;
        setCountdown(seconds);
        if (seconds === 0) clearInterval(interval);
      }, 1000);

      setTimeout(async () => {
        try {
          await fetch("/api/deleteUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
        } catch {}

        router.replace("/");
      }, 5000);

      return;
    }

    // Valid college user → submit pending request
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

      toast.success("Access request submitted");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Confirm your details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {showBlockedPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg text-center space-y-3">
            <h2 className="text-xl font-bold text-red-500">
              Invalid Email
            </h2>
            <p>
              You must use your <b>@mail.jiit.ac.in</b> account.
            </p>
            <p className="text-sm text-gray-400">
              Redirecting in {countdown} seconds…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
