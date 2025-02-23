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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddClaim = async () => {
    if (!email || !role) {
      setDialogMessage("Please enter both email and role.");
      setDialogType("error");
      setDialogOpen(true);
      return;
    }

    if (!validateEmail(email)) {
      setDialogMessage("Invalid email format. Please enter a valid email.");
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
      console.error("Error adding claim:", error);
      setDialogMessage("Failed to add custom claim.");
      setDialogType("error");
    }

    setDialogOpen(true);
    setIsSubmitting(false);
  };

  return (
    <div className="dark:text-white flex items-center justify-center w-full h-screen p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Manage User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="user@example.com"
            />
            <Label>Role</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              type="text"
              placeholder="Enter role (e.g., admin, moderator)"
            />
            <Button onClick={handleAddClaim} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Adding..." : "Add Custom Claim"}
            </Button>
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
