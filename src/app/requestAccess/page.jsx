"use client";

import React, { useState, useRef, use } from "react";
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

export default function AccessRequestForm() {
  const { user, loading, isAdmin, checkingAuth } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [emailError, setEmailError] = useState("");
  const [enrollmentError, setEnrollmentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formRef = useRef(null);
  const formId = "1gorhcyw1lG-opaLOTnSK3IgyzPNR9K-Q05B3TGsS4Jc";
  const router = useRouter();

  if (user) {
    router.replace("/");
  }

  if (loading || checkingAuth) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateEnrollment = (enrollment) => {
    const enrollmentRegex = /^\d{10}$/;
    if (!enrollmentRegex.test(enrollment)) {
      setEnrollmentError("Enrollment number must be exactly 10 digits.");
      return false;
    }
    setEnrollmentError("");
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isEmailValid = validateEmail(email);
    const isEnrollmentValid = validateEnrollment(enrollment);

    if (!isEmailValid || !isEnrollmentValid) {
      return;
    }

    const form = formRef.current;
    if (form) {
      try {
        setIsSubmitting(true);
        form.submit();
        form.reset();
        toast.success("Access request sent successfully!");
        setName("");
        setEmail("");
        setEnrollment("");
        setIsDialogOpen(true);
      } catch (error) {
        toast.error("Error sending request. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Request Access to the Site</CardTitle>
          <p className="text-sm text-gray-500">
            The email provided does not need to be your official college email; use the one from which you want access.
          </p>
        </CardHeader>
        <CardContent>
          <iframe name="iframe_form" id="iframe_form" style={{ display: "none" }}></iframe>
          <form
            ref={formRef}
            action={`https://docs.google.com/forms/d/${formId}/formResponse`}
            method="POST"
            target="iframe_form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="entry.2005620554"
                aria-label="Full Name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="entry.1045781291"
                aria-label="Email"
                type="email"
                placeholder="your@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                required
              />
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollment">Enrollment Number</Label>
              <Input
                id="enrollment"
                name="entry.1065046570"
                aria-label="Enrollment Number"
                type="text"
                placeholder="Ex: 992310XXXX"
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value)}
                onBlur={() => validateEnrollment(enrollment)}
                required
              />
              {enrollmentError && <p className="text-red-500 text-sm">{enrollmentError}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Request Access"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alert Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Under Review</AlertDialogTitle>
            <AlertDialogDescription>
              Your request has been submitted and is under review. Please check back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsDialogOpen(false);
                router.replace("/");
              }}
            >
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}