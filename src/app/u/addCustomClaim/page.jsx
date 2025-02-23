"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function ManageUser() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifiedRole, setVerifiedRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success");

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddClaim = async () => {
    if (!email || !role) {
      setDialogMessage("Please enter both email and role.");
      setDialogType("error");
      setDialogOpen(true);
      return;
    }

    if (!validateEmail(email)) {
      setDialogMessage("Invalid email format.");
      setDialogType("error");
      setDialogOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/setCustomClaim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await response.json();

      if (response.ok) {
        setDialogMessage("Custom claim added successfully!");
        setDialogType("success");
        setEmail("");
        setRole("");
      } else {
        setDialogMessage(data.message || "Failed to add custom claim.");
        setDialogType("error");
      }
    } catch (error) {
      setDialogMessage("Failed to add custom claim.");
      setDialogType("error");
    }

    setDialogOpen(true);
    setIsSubmitting(false);
  };

  const handleVerifyClaim = async () => {
    if (!verifyEmail) {
      setDialogMessage("Please enter an email to verify.");
      setDialogType("error");
      setDialogOpen(true);
      return;
    }

    if (!validateEmail(verifyEmail)) {
      setDialogMessage("Invalid email format.");
      setDialogType("error");
      setDialogOpen(true);
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/verifyClaim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });
      const data = await response.json();

      if (response.ok) {
        setVerifiedRole(data.role || "No role found");
      } else {
        setDialogMessage(data.error || "Failed to verify claim.");
        setDialogType("error");
        setDialogOpen(true);
      }
    } catch (error) {
      setDialogMessage("Failed to verify custom claim.");
      setDialogType("error");
      setDialogOpen(true);
    }

    setIsVerifying(false);
  };

  return (
    <div className="dark:text-white flex flex-col items-center justify-center w-full h-screen p-4 space-y-6">
      {/* Set Custom Claim Form */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Manage User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="user@example.com" />
            <Label>Role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} type="text" placeholder="Enter role (e.g., admin, moderator)" />
            <Button onClick={handleAddClaim} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Adding..." : "Add Custom Claim"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verify Custom Claim Form */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Verify User Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Email</Label>
            <Input value={verifyEmail} onChange={(e) => setVerifyEmail(e.target.value)} type="email" placeholder="user@example.com" />
            <Button onClick={handleVerifyClaim} disabled={isVerifying} className="w-full">
              {isVerifying ? "Verifying..." : "Verify Role"}
            </Button>
            {verifiedRole && (
              <p className="text-center text-lg font-semibold">
                Role: <span className="text-green-500">{verifiedRole}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialog for Success/Error Messages */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{dialogType === "error" ? "Error" : "Success"}</AlertDialogTitle>
          <AlertDialogDescription className={dialogType === "error" ? "text-red-500" : "text-green-500"}>
            {dialogMessage}
          </AlertDialogDescription>
          <AlertDialogAction onClick={() => setDialogOpen(false)}>OK</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
