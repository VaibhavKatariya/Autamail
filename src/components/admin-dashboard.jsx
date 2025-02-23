"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ref, get, set } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success"); // "success" or "error"

  const handleAddUser = async () => {
    if (!email) {
      setDialogMessage("Please enter an email address.");
      setDialogType("error");
      setDialogOpen(true);
      return;
    }

    setIsSubmitting(true);
    const usersRef = ref(rtdb, "users");

    try {
      const snapshot = await get(usersRef);
      let usersList = snapshot.exists() ? snapshot.val() : [];

      if (usersList.includes(email)) {
        setDialogMessage("User already exists in the list.");
        setDialogType("error");
      } else {
        usersList.push(email);
        await set(usersRef, usersList);
        setDialogMessage("User added successfully!");
        setDialogType("success");
        setEmail("");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setDialogMessage("Failed to add user.");
      setDialogType("error");
    }

    setDialogOpen(true);
    setIsSubmitting(false);
  };

  return (
    <div className="dark:text-white flex items-center justify-center w-full h-screen p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>User Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="user@example.com"
            />
            <Button onClick={handleAddUser} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Adding..." : "Add User"}
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
