"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import AccessRequestFormSkeleton from "@/components/skeletonUI/requestAccessSkeleton";

export default function AccessRequestPage() {
  const { user, role, loading, checkingAuth } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [emailError, setEmailError] = useState("");
  const [enrollmentError, setEnrollmentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formRef = useRef(null);
  const formId = "1gorhcyw1lG-opaLOTnSK3IgyzPNR9K-Q05B3TGsS4Jc";

  // ✅ ALL redirects happen here
  useEffect(() => {
    if (loading || checkingAuth) return;

    // Not logged in
    if (!user) {
      router.replace("/");
      return;
    }

    // Already approved
    if (role) {
      router.replace("/dashboard");
    }
  }, [user, role, loading, checkingAuth, router]);

  // ⏳ Loading state
  if (loading || checkingAuth) {
    return <AccessRequestFormSkeleton />;
  }

  // Prevent flash while redirecting
  if (!user || role) {
    return null;
  }

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateEnrollment = (value) => {
    const enrollmentRegex = /^\d{10}$/;
    if (!enrollmentRegex.test(value)) {
      setEnrollmentError("Enrollment number must be exactly 10 digits.");
      return false;
    }
    setEnrollmentError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email) || !validateEnrollment(enrollment)) return;

    try {
      setIsSubmitting(true);
      formRef.current.submit();
      formRef.current.reset();

      toast.success("Access request sent successfully");
      setName("");
      setEmail("");
      setEnrollment("");
      setDialogOpen(true);
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Request Access</CardTitle>
          <p className="text-sm text-gray-500">
            You are logged in but not approved yet.
          </p>
        </CardHeader>

        <CardContent>
          <iframe name="iframe_form" style={{ display: "none" }} />

          <form
            ref={formRef}
            action={`https://docs.google.com/forms/d/${formId}/formResponse`}
            method="POST"
            target="iframe_form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <Label>Full Name</Label>
              <Input
                name="entry.2005620554"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                name="entry.1045781291"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                required
              />
              {emailError && (
                <p className="text-red-500 text-sm">{emailError}</p>
              )}
            </div>

            <div>
              <Label>Enrollment Number</Label>
              <Input
                name="entry.1065046570"
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value)}
                onBlur={() => validateEnrollment(enrollment)}
                required
              />
              {enrollmentError && (
                <p className="text-red-500 text-sm">{enrollmentError}</p>
              )}
            </div>

            <Button disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Request Access"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Submitted</AlertDialogTitle>
            <AlertDialogDescription>
              Your request is under review. You’ll be notified once approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
