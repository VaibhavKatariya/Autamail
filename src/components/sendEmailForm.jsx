"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Papa from "papaparse";

export default function SendEmailForm({ fromEmail }) {
  const [template, setTemplate] = useState("");
  const [bulkEntries, setBulkEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("");
  const [removingIndex, setRemovingIndex] = useState(null);
  const [user] = useAuthState(auth);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const allEmailsValid = bulkEntries.every((entry) => entry.email && validateEmail(entry.email));

  const checkEmailsBeforeSending = async (entries) => {
    const alreadySentEmails = new Set();
    const alreadyQueuedEmails = new Set();
    const emailsToCheck = entries.map((entry) => entry.email.toLowerCase());

    try {
      // Check sentEmails collection
      const sentQuery = query(collection(db, "sentEmails"), where("email", "in", emailsToCheck));
      const sentSnapshot = await getDocs(sentQuery);
      sentSnapshot.forEach((doc) => {
        alreadySentEmails.add(doc.data().email.toLowerCase());
      });

      // Check queuedEmails collection
      const queuedQuery = query(collection(db, "queuedEmails"), where("email", "in", emailsToCheck));
      const queuedSnapshot = await getDocs(queuedQuery);
      queuedSnapshot.forEach((doc) => {
        alreadyQueuedEmails.add(doc.data().email.toLowerCase());
      });

      return { 
        unsentEntries: entries.filter((entry) => !alreadySentEmails.has(entry.email.toLowerCase()) && !alreadyQueuedEmails.has(entry.email.toLowerCase())),
        alreadySent: entries.filter((entry) => alreadySentEmails.has(entry.email.toLowerCase())),
        alreadyQueued: entries.filter((entry) => alreadyQueuedEmails.has(entry.email.toLowerCase()))
      };
    } catch (error) {
      console.error("Error checking emails: ", error);
      return { unsentEntries: [], alreadySent: [], alreadyQueued: [] };
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results.errors.length > 0) {
          setDialogMessage("Error parsing CSV file. Please check the file format.");
          setDialogType("error");
          setIsDialogOpen(true);
          return;
        }

        const parsedEntries = results.data.map((row) => ({
          name: row.Name || "",
          email: row.Email?.toLowerCase() || "",
        }));

        const validEntries = parsedEntries.filter((entry) => validateEmail(entry.email));

        if (validEntries.length === 0) {
          setDialogMessage("No valid emails found in the CSV.");
          setDialogType("error");
          setIsDialogOpen(true);
          return;
        }

        setBulkEntries(validEntries);
      },
      error: function (error) {
        setDialogMessage("Error reading CSV file. Please try again.");
        setDialogType("error");
        setIsDialogOpen(true);
      },
    });
  };

  const handleBulkSubmit = async () => {
    if (!user) {
      setDialogMessage("You must be logged in to send emails.");
      setDialogType("error");
      setIsDialogOpen(true);
      return;
    }

    if (bulkEntries.length === 0) {
      setDialogMessage("Please add at least one recipient.");
      setDialogType("error");
      setIsDialogOpen(true);
      return;
    }

    if (!template) {
      setDialogMessage("Please select an email template.");
      setDialogType("error");
      setIsDialogOpen(true);
      return;
    }

    setIsSubmitting(true);

    // Check for duplicate emails in bulkEntries
    const emailCount = new Map();
    const duplicateEmails = [];
    bulkEntries.forEach((entry) => {
      const email = entry.email.toLowerCase();
      emailCount.set(email, (emailCount.get(email) || 0) + 1);
      if (emailCount.get(email) > 1 && !duplicateEmails.some((dup) => dup.email === email)) {
        duplicateEmails.push(entry);
      }
    });

    const uniqueEntries = bulkEntries.filter((entry, index, self) =>
      index === self.findIndex((e) => e.email.toLowerCase() === entry.email.toLowerCase())
    );

    const { unsentEntries, alreadySent, alreadyQueued } = await checkEmailsBeforeSending(uniqueEntries);
    let failedEmails = [];

    if (unsentEntries.length === 0) {
      const messageLines = [];
      if (alreadySent.length > 0) {
        messageLines.push(`Skipped (already sent):\n${alreadySent.map((e) => `${e.email} (${e.name || "No name"})`).join("\n")}`);
      }
      if (alreadyQueued.length > 0) {
        messageLines.push(`Skipped (already queued):\n${alreadyQueued.map((e) => `${e.email} (${e.name || "No name"})`).join("\n")}`);
      }
      if (duplicateEmails.length > 0) {
        messageLines.push(`Skipped (duplicates):\n${duplicateEmails.map((e) => `${e.email} (${e.name || "No name"})`).join("\n")}`);
      }
      setDialogMessage(messageLines.length > 0 ? messageLines.join("\n\n") : "No emails were queued.");
      setDialogType("warning");
      setIsSubmitting(false);
      setIsDialogOpen(true);
      return;
    }

    try {
      for (const entry of unsentEntries) {
        const data = {
          email: entry.email.toLowerCase(),
          name: entry.name,
          template,
          messageId: "",
          fromEmail,
          sentAt: new Date().toISOString(),
          status: "queued",
          uid: user.uid,
        };

        const setGlobalLog = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/setEmailLog`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionName: "queuedEmails", data }),
        });

        const globalLogData = await setGlobalLog.json();

        if (setGlobalLog.ok) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/setEmailLog`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ docId: globalLogData.id, collectionName: `users/${user.uid}/sentEmails`, data }),
          });
        } else {
          failedEmails.push(entry);
        }
      }

      const messageLines = [];
      if (unsentEntries.length > failedEmails.length) {
        messageLines.push("Email(s) Queued!");
      }
      if (alreadySent.length > 0) {
        messageLines.push(`Skipped (already sent):\n${alreadySent.map((e) => `${e.email} (${e.name || "No name"})`).join("\n")}`);
      }
      if (alreadyQueued.length > 0) {
        messageLines.push(`Skipped (already queued):\n${alreadyQueued.map((e) => `${e.email} (${e.name || "No name"})`).join("\n")}`);
      }
      if (duplicateEmails.length > 0) {
        messageLines.push(`Skipped (duplicates):\n${duplicateEmails.map((e) => `${e.email} (${e.name || "No name"})`).join("\n")}`);
      }
      if (failedEmails.length > 0) {
        messageLines.push(`Failed to queue:\n${failedEmails.map((e) => `${e.email} (${e.name || "No name"})`).join("\n")}`);
      }

      setDialogMessage(messageLines.join("\n\n") || "No emails processed.");
      setDialogType(failedEmails.length > 0 || duplicateEmails.length > 0 ? "warning" : "success");

    } catch (error) {
      setDialogMessage(`Error occurred while queuing emails:\n${error.message}`);
      setDialogType("error");
    }

    setBulkEntries([]);
    setTemplate("");
    setIsSubmitting(false);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Email Dashboard</CardTitle>
          <CardDescription className="text-center">Why do things manually in 2 minutes when you can spend hours automating them? 😏</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bulk" className="w-full">
            <TabsContent value="bulk">
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                <div className="mb-4">
                  <Label>Upload CSV File</Label>
                  <Input className="cursor-pointer" type="file" accept=".csv" onChange={handleFileUpload} />
                </div>
                {bulkEntries.length === 0 && <Label className="text-center block">OR</Label>}
                {bulkEntries.map((entry, index) => (
                  <div
                    key={index}
                    className={`space-y-2 border p-4 rounded-lg flex flex-col gap-2 relative transition-opacity duration-300 ${
                      removingIndex === index ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <span>Entry {index + 1}</span>
                    <Button
                      onClick={() => {
                        setRemovingIndex(index);
                        setTimeout(() => {
                          setBulkEntries(bulkEntries.filter((_, i) => i !== index));
                          setRemovingIndex(null);
                        }, 300);
                      }}
                      className="absolute top-2 right-2"
                      variant="outline"
                    >
                      <Trash2 size={16} />
                    </Button>
                    <Label>Company/Person Name</Label>
                    <Input
                      value={entry.name}
                      onChange={(e) =>
                        setBulkEntries(
                          bulkEntries.map((item, i) =>
                            i === index ? { ...item, name: e.target.value } : item
                          )
                        )
                      }
                      placeholder="Company/Person Name"
                    />
                    <Label>Email</Label>
                    <Input
                      value={entry.email}
                      onChange={(e) =>
                        setBulkEntries(
                          bulkEntries.map((item, i) =>
                            i === index ? { ...item, email: e.target.value.toLowerCase() } : item
                          )
                        )
                      }
                      type="email"
                      placeholder="Person@example.com"
                    />
                    {!validateEmail(entry.email) && entry.email && (
                      <p className="text-red-500 text-sm">Invalid email format</p>
                    )}
                  </div>
                ))}

                <Button onClick={() => setBulkEntries([...bulkEntries, { name: "", email: "" }])} className="w-full">
                  Add Company/Person
                </Button>
                <div className="mt-1">
                  <Label>Select Email Template</Label>
                </div>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="Sponsor">
                      Sponsor's mail
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value="Chief">
                      Chief's mail
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value="Participant">
                      Participant's mail
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkSubmit} disabled={isSubmitting || !allEmailsValid} className="w-full">
                  {isSubmitting ? (
                    <>
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Send Email(s)"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogType === "success" ? "Success!" : dialogType === "warning" ? "Warning!" : "Error!"}</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="py-2 whitespace-pre-line max-h-[300px] overflow-y-auto">{dialogMessage}</div>
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>Okay</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}