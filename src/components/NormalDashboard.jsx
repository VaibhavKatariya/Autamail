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
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import Mailgun from "mailgun.js";
import FormData from "form-data";

export default function SponsorEmailDashboard({ fromEmail }) {
  const [template, setTemplate] = useState("");
  const [bulkEntries, setBulkEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("");
  const [user] = useAuthState(auth);

  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.NEXT_PUBLIC_MAILGUN_API_KEY,
    url: "https://api.eu.mailgun.net",
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleBulkSubmit = async () => {
    if (!user) {
      setDialogMessage("You must be logged in to send emails.");
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

    for (const entry of bulkEntries) {
      if (!entry.name || !entry.email || !validateEmail(entry.email)) {
        setDialogMessage("All fields must be filled with valid emails.");
        setDialogType("error");
        setIsDialogOpen(true);
        return;
      }
    }

    setIsSubmitting(true);
    let templateName = template === "A" ? "sponsor" : template === "B" ? "chief" : "participant"; // Template names in Mailgun

    try {
      for (const entry of bulkEntries) {

        const emailResponse = await mg.messages.create(process.env.NEXT_PUBLIC_MAILGUN_DOMAIN, {
          from: "GDG JIIT admin@gdg-jiit.com",
          to: entry.email,
          template: templateName,
          "h:X-Mailgun-Variables": JSON.stringify({ name: entry.name }),
        });

        const messageId = emailResponse.id;
        const cleanedMessageId = messageId.replace(/[<>]/g, "");

        await addDoc(collection(db, "sentEmails"), {
          companyName: entry.name,
          email: entry.email,
          templateUsed: templateName,
          sentBy: user.email,
          timestamp: new Date().toISOString(),
          messageId: cleanedMessageId,
          status: "pending",
        });

      }

      setDialogMessage("Emails sent successfully! Status is being processed.");
      setDialogType("success");
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
              <div className="space-y-4">
                {bulkEntries.map((entry, index) => (
                  <div key={index} className="space-y-2 border p-4 rounded-lg flex flex-col gap-2 relative">
                    <Button onClick={() => setBulkEntries(bulkEntries.filter((_, i) => i !== index))} className="absolute top-2 right-2" variant="outline">
                      <Trash2 size={16} />
                    </Button>
                    <Label>Company/Person Name</Label>
                    <Input value={entry.name} onChange={(e) => setBulkEntries(bulkEntries.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="Company/Person Name" />
                    <Label>Email</Label>
                    <Input value={entry.email} onChange={(e) => setBulkEntries(bulkEntries.map((item, i) => i === index ? { ...item, email: e.target.value } : item))} type="email" placeholder="Person@example.com" />
                  </div>
                ))}
                <Button onClick={() => setBulkEntries([...bulkEntries, { name: "", email: "" }])} className="w-full">Add Company/Person</Button>
                <Label>Select Email Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Sponsor's mail</SelectItem>
                    <SelectItem value="B">Chief's mail</SelectItem>
                    <SelectItem value="C">Participant's mail</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkSubmit} disabled={isSubmitting} className="w-full">
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
