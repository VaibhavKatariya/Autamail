"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function ManageUser() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [verifiedRole, setVerifiedRole] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success");
  const [activeAction, setActiveAction] = useState("add"); // "add", "verify", "remove"

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAction = async () => {
    if (!email || (activeAction === "add" && !role)) {
      setDialogMessage("Please enter the required fields.");
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

    setIsProcessing(true);
    try {
      let endpoint = "";
      let body = { email };
      
      if (activeAction === "add") {
        endpoint = "/api/setCustomClaim";
        body.role = role;
      } else if (activeAction === "verify") {
        endpoint = "/api/verifyClaim";
      } else if (activeAction === "remove") {
        endpoint = "/api/removeCustomClaim";
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (response.ok) {
        if (activeAction === "verify") {
          setVerifiedRole(data.role || "No role found");
        } else {
          setDialogMessage(
            activeAction === "add"
              ? "Custom claim added successfully!"
              : "Custom claim removed successfully!"
          );
          setDialogType("success");
          setDialogOpen(true);
          setEmail("");
          setRole("");
        }
      } else {
        setDialogMessage(data.message || "Action failed.");
        setDialogType("error");
        setDialogOpen(true);
      }
    } catch (error) {
      setDialogMessage("Something went wrong.");
      setDialogType("error");
      setDialogOpen(true);
    }

    setIsProcessing(false);
  };

  return (
    <div className="dark:text-white flex flex-col items-center justify-center w-full h-screen p-4 space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Manage User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="user@example.com" />
          {activeAction === "add" && (
            <>
              <Label>Role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} type="text" placeholder="Enter role" />
            </>
          )}
          <Button onClick={handleAction} disabled={isProcessing} className="w-full">
            {isProcessing ? "Processing..." : activeAction === "add" ? "Add Custom Claim" : activeAction === "verify" ? "Verify Role" : "Remove Custom Claim"}
          </Button>
          {activeAction === "verify" && verifiedRole && (
            <p className="text-center text-lg font-semibold">
              Role: <span className="text-green-500">{verifiedRole}</span>
            </p>
          )}
        </CardContent>
      </Card>
      
      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => setActiveAction("add")} className={activeAction === "add" ? "bg-blue-500 text-white" : ""}>
          Add Claim
        </Button>
        <Button variant="outline" onClick={() => setActiveAction("verify")} className={activeAction === "verify" ? "bg-blue-500 text-white" : ""}>
          Verify Claim
        </Button>
        <Button variant="outline" onClick={() => setActiveAction("remove")} className={activeAction === "remove" ? "bg-blue-500 text-white" : ""}>
          Remove Claim
        </Button>
      </div>

      {/* Alert Dialog for Add/Remove Claims */}
      {activeAction !== "verify" && (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>{dialogType === "error" ? "Error" : "Success"}</AlertDialogTitle>
            <AlertDialogDescription className={dialogType === "error" ? "text-red-500" : "text-green-500"}>
              {dialogMessage}
            </AlertDialogDescription>
            <AlertDialogAction onClick={() => setDialogOpen(false)}>OK</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
