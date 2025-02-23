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
  const [role, setRole] = useState("member"); // Default role
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success"); // "success" or "error"

  // Function to validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddUser = async () => {
    if (!email) {
      setDialogMessage("Please enter an email address.");
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
    const usersRef = ref(rtdb, "users");

    try {
      const snapshot = await get(usersRef);
      let usersList = snapshot.exists() ? snapshot.val() : [];

      // Check if user already exists
      if (usersList.some(user => user.email === email)) {
        setDialogMessage("User already exists in the list.");
        setDialogType("error");
      } else {
        // Add new user object
        usersList.push({ email, role });
        await set(usersRef, usersList);
        setDialogMessage("User added successfully!");
        setDialogType("success");
        setEmail("");
        setRole("member"); // Reset role to default
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
    <div className="dark:text-white flex items-center justify-center w-full p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Add a user</CardTitle>
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
            <Label>User Role</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border bg-black text-white border-gray-300 rounded-md p-2 w-full"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
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
