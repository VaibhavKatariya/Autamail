"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ref, get, set } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUser = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);
    const usersRef = ref(rtdb, "users");

    try {
      const snapshot = await get(usersRef);
      let usersList = snapshot.exists() ? snapshot.val() : [];

      if (usersList.includes(email)) {
        toast.error("User already exists in the list");
      } else {
        usersList.push(email);
        await set(usersRef, usersList);
        toast.success("User added successfully!");
        setEmail("");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center w-full h-screen p-4">
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
    </div>
  );
}