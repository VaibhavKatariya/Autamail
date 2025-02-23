"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase"; // Import Firestore instance
import { collection, addDoc, writeBatch, doc } from "firebase/firestore"; // Import 'doc' here
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase"; // Import Firebase auth

export default function SponsorEmailDashboard({ fromEmail }) {
  const [template, setTemplate] = useState("");
  const [bulkEntries, setBulkEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState(""); // For dialog messages
  const [dialogType, setDialogType] = useState(""); // For success or error type
  const formId = "10amvbxLmUDHbvVKVck3uleKC2sABzfGTbJL4GN0o2_M";
  const [user] = useAuthState(auth); // Get the logged-in user

  const handleBulkSubmit = async () => {
    if (!user) {
      setDialogMessage("You must be logged in to send emails.");
      setDialogType("error");
      setIsDialogOpen(true);
      return;
    }

    // Check if template is selected
    if (!template) {
      setDialogMessage("Please select an email template.");
      setDialogType("error");
      setIsDialogOpen(true);
      return;
    }

    // Check if all bulk entries are filled
    for (const entry of bulkEntries) {
      if (!entry.name || !entry.email) {
        setDialogMessage("All fields must be filled in each entry.");
        setDialogType("error");
        setIsDialogOpen(true);
        return;
      }
    }

    setIsSubmitting(true);
    const sentEmails = [];

    for (const entry of bulkEntries) {
      const formData = new FormData();
      formData.append("entry.852843744", entry.name);
      formData.append("entry.1045781291", entry.email);
      formData.append("entry.837450281", template);
      formData.append("entry.1580046483", fromEmail);

      try {
        await fetch(`https://docs.google.com/forms/d/${formId}/formResponse`, {
          method: "POST",
          body: formData,
          mode: "no-cors",
        });

        // Add successful email to the list
        sentEmails.push({
          companyName: entry.name,
          email: entry.email,
          templateUsed: template,
          sentBy: user.email, // Store the sender's email
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setDialogMessage(`Failed to send email to ${entry.name} (${entry.email})`);
        setDialogType("error");
        setIsDialogOpen(true);
        console.error("Error:", error);
        setIsSubmitting(false);
        return; // Exit on error
      }
    }

    // Save the sent emails list to Firestore
    if (sentEmails.length > 0) {
      const batch = writeBatch(db); // Create a batch for atomic writes

      try {
        // Add to the global sentEmails collection
        const sentEmailsRef = collection(db, "sentEmails");
        const sentEmailsDocRef = doc(sentEmailsRef); // Create a new document reference
        batch.set(sentEmailsDocRef, {
          emails: sentEmails,
          sentAt: new Date(),
        });

        // Add to the user's specific sentEmails subcollection
        const userSentEmailsRef = collection(db, `users/${user.uid}/sentEmails`);
        const userSentEmailsDocRef = doc(userSentEmailsRef); // Create a new document reference
        batch.set(userSentEmailsDocRef, {
          emails: sentEmails,
          sentAt: new Date(),
        });

        await batch.commit();
      } catch (error) {
        console.error("Error storing email data in Firestore:", error);
        setDialogMessage("Failed to save email records.");
        setDialogType("error");
      }
    }

    setBulkEntries([]);
    setTemplate("");
    setIsDialogOpen(true);
    setIsSubmitting(false);
  };

  const addBulkEntry = () => {
    setBulkEntries([...bulkEntries, { name: "", email: "" }]);
  };

  const updateBulkEntry = (index, field, value) => {
    const updatedEntries = [...bulkEntries];
    updatedEntries[index][field] = value;
    setBulkEntries(updatedEntries);
  };

  const removeBulkEntry = (index) => {
    setBulkEntries(bulkEntries.filter((_, i) => i !== index));
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Email Dashboard</CardTitle>
          <CardDescription className="text-center">Send emails in fast pace😏</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bulk" className="w-full">
            <TabsContent value="bulk">
              <div className="space-y-4">
                {bulkEntries.map((entry, index) => (
                  <div key={index} className="space-y-2 border p-4 rounded-lg flex flex-col gap-2 relative">
                    <Button onClick={() => removeBulkEntry(index)} className="absolute top-2 right-2" variant="outline">
                      <Trash2 size={16} />
                    </Button>
                    <Label>Company/Person Name</Label>
                    <Input
                      value={entry.name}
                      onChange={(e) => updateBulkEntry(index, "name", e.target.value)}
                      placeholder="Company/Person Name"
                    />
                    <Label>Email</Label>
                    <Input
                      value={entry.email}
                      onChange={(e) => updateBulkEntry(index, "email", e.target.value)}
                      type="email"
                      placeholder="Person@example.com"
                    />
                  </div>
                ))}
                <Button onClick={addBulkEntry} className="w-full">Add Company/Person</Button>
                <Label>Select Email Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent className="cursor-pointer">
                    <SelectItem className="cursor-pointer" value="A">Sponsor's mail</SelectItem>
                    <SelectItem className="cursor-pointer" value="B">Chief's mail</SelectItem>
                    <SelectItem className="cursor-pointer" value="C">Participant's mail</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkSubmit} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Send Bulk Email"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogType === "success" ? "Success!" : "Error!"}</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="py-2">{dialogMessage}</div>
            <AlertDialogAction onClick={handleDialogClose}>Okay</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
