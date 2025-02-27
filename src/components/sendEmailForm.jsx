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
import { auth } from "@/lib/firebase";
import Mailgun from "mailgun.js";
import FormData from "form-data";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Papa from "papaparse";

export default function SendEmailForm({ fromEmail }) {
  const [template, setTemplate] = useState("");
  const [bulkEntries, setBulkEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("");
  const [removingIndex, setRemovingIndex] = useState();
  const [user] = useAuthState(auth);

  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.NEXT_PUBLIC_MAILGUN_API_KEY,
    url: "https://api.eu.mailgun.net",
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const allEmailsValid = bulkEntries.every(entry => entry.email && validateEmail(entry.email));

  let alreadySentEmails = new Set();

  const checkEmailsBeforeSending = async (entries) => {
    setIsDialogOpen(true);
    setDialogMessage("Checking emails...");

    const emailsToCheck = entries.map(entry => entry.email.toLowerCase());

    try {
      const q = query(collection(db, "sentEmails"), where("email", "in", emailsToCheck));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        alreadySentEmails.add(doc.data().email.toLowerCase());
      });

      let filteredEntries = entries.filter(entry => !alreadySentEmails.has(entry.email));

      let logMessages = entries.map(entry =>
        alreadySentEmails.has(entry.email)
          ? `❌ email to ${entry.email} was already sent. Skipping.`
          : `✅ ${entry.email} is not sent yet.`
      );

      setDialogMessage(logMessages.join("\n"));

      if (filteredEntries.length === 0) {
        setDialogType("error");
        return [];
      }

      setDialogType("success");
      return filteredEntries;
    } catch (error) {
      console.error("Error checking emails: ", error);
      setDialogMessage("Error checking emails. Try again.");
      setDialogType("error");
      return [];
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

    const unsentEntries = await checkEmailsBeforeSending(bulkEntries);
    if (unsentEntries.length === 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      for (const entry of unsentEntries) {
        const emailResponse = await mg.messages.create(process.env.NEXT_PUBLIC_MAILGUN_DOMAIN, {
          from: "GDG JIIT admin@gdg-jiit.com",
          to: entry.email.toLowerCase(),
          template: template,
          "h:X-Mailgun-Variables": JSON.stringify({ name: entry.name }),
        });

        const messageId = emailResponse.id.replace(/[<>]/g, "");

        const data = {
          email: entry.email.toLowerCase(),
          name: entry.name,
          template,
          messageId,
          fromEmail,
          sentAt: new Date().toISOString(),
          status: "pending",
          uid: user.uid,
        };

        const setGlobalLog = await fetch("/api/setEmailLog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionName: "sentEmails", data }),
        });

        const globalLogData = await setGlobalLog.json();

        await fetch("/api/setEmailLog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId: globalLogData.id, collectionName: `users/${user.uid}/sentEmails`, data }),
        });
      }

      let failedEmails = bulkEntries
        .filter(entry => alreadySentEmails.has(entry.email))
        .map(entry => entry.email);

      if (failedEmails.length > 0) {
        setDialogMessage(`Some emails were not sent:\n\n${failedEmails.join("\n")} ❌ \n\nOther emails are being processed.`);
        setDialogType("warning");
      } else {
        setDialogMessage("All emails sent successfully!");
        setDialogType("success");
      }

    } catch (error) {
      setDialogMessage("Failed to send emails. Please try again.");
      setDialogType("error");
    }

    setBulkEntries([]);
    setTemplate("");
    setIsDialogOpen(true);
    setIsSubmitting(false);
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
                    className={`space-y-2 border p-4 rounded-lg flex flex-col gap-2 relative transition-opacity duration-300 ${removingIndex === index ? "opacity-0" : "opacity-100"
                      }`}
                  >
                    <span>Entry {index + 1}</span>
                    <Button
                      onClick={() => {
                        setRemovingIndex(index);
                        setTimeout(() => {
                          setBulkEntries(bulkEntries.filter((_, i) => i !== index));
                          setRemovingIndex(null);
                        }, 300); // Matches the duration of the CSS animation
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

                <Button onClick={() => setBulkEntries([...bulkEntries, { name: "", email: "" }])} className="w-full">Add Company/Person</Button>
                <div className="mt-1"><Label>Select Email Template</Label></div>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="Sponsor">Sponsor's mail</SelectItem>
                    <SelectItem className="cursor-pointer" value="Chief">Chief's mail</SelectItem>
                    <SelectItem className="cursor-pointer" value="Participant">Participant's mail</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkSubmit} disabled={isSubmitting || !allEmailsValid} className="w-full">
                  {isSubmitting ? <><ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Send Email(s)"}
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
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>Okay</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}