"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { ReloadIcon } from "@radix-ui/react-icons";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import Papa from "papaparse";

export default function QueueEmailForm({ fromEmail }) {
  const [template, setTemplate] = useState("");
  const [bulkEntries, setBulkEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success");
  const [removingIndex, setRemovingIndex] = useState(null);
  const [user] = useAuthState(auth);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const allEmailsValid =
    bulkEntries.length > 0 &&
    bulkEntries.every((e) => e.email && validateEmail(e.email));

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
          setDialogType("error");
          setDialogMessage("Invalid CSV format");
          setIsDialogOpen(true);
          return;
        }

        const seen = new Set();

        const parsed = results.data
          .map((row) => ({
            name: row.Name?.trim() || "",
            email: row.Email?.toLowerCase().trim() || "",
          }))
          .filter(
            (e) =>
              validateEmail(e.email) && !seen.has(e.email) && seen.add(e.email),
          );

        if (!parsed.length) {
          setDialogType("error");
          setDialogMessage("No valid unique emails found");
          setIsDialogOpen(true);
          return;
        }

        setBulkEntries(parsed);
      },
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!bulkEntries.length) {
      setDialogType("error");
      setDialogMessage("Add at least one recipient");
      setIsDialogOpen(true);
      return;
    }

    if (!template) {
      setDialogType("error");
      setDialogMessage("Select an email template");
      setIsDialogOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/queueEmails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: bulkEntries.map((e) => ({
            email: e.email,
            name: e.name,
          })),
          template,
          fromEmail,
          uid: user.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setDialogType("success");
      setDialogMessage(
        [
          data.message,
          data.queuedCount ? `Queued: ${data.queuedCount}` : null,
          data.skippedCount
            ? `Skipped (already queued/sent): ${data.skippedCount}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      );

      setBulkEntries([]);
      setTemplate("");
    } catch (err) {
      setDialogType("error");
      setDialogMessage(err.message || "Failed to queue emails");
    } finally {
      setIsSubmitting(false);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="flex justify-center w-full p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Email Queue</CardTitle>
          <CardDescription>
            Upload CSV or add recipients manually. Emails require admin approval
            before sending.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="bulk">
            <TabsContent value="bulk">
              <div className="space-y-4 max-h-[420px] overflow-y-auto">
                <div>
                  <Label>Upload CSV</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                </div>

                {bulkEntries.length === 0 && (
                  <p className="text-center text-muted-foreground">OR</p>
                )}

                {bulkEntries.map((entry, i) => (
                  <div
                    key={i}
                    className={`border p-4 rounded-lg space-y-3 relative transition-opacity ${
                      removingIndex === i ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setRemovingIndex(i);
                        setTimeout(() => {
                          setBulkEntries((p) => p.filter((_, x) => x !== i));
                          setRemovingIndex(null);
                        }, 200);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>

                    <div>
                      <Label>Name</Label>
                      <Input
                        value={entry.name}
                        onChange={(e) =>
                          setBulkEntries((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label>Email</Label>
                      <Input
                        value={entry.email}
                        placeholder="person@example.com"
                        onChange={(e) =>
                          setBulkEntries((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? {
                                    ...x,
                                    email: e.target.value.toLowerCase(),
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                      {entry.email && !validateEmail(entry.email) && (
                        <p className="text-sm text-red-500">Invalid email</p>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() =>
                    setBulkEntries((p) => [...p, { name: "", email: "" }])
                  }
                >
                  Add Recipient
                </Button>

                <div>
                  <Label>Email Template</Label>
                  <Select value={template} onValueChange={setTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sponsor">Sponsor</SelectItem>
                      <SelectItem value="Chief">Chief</SelectItem>
                      <SelectItem value="Participant">Participant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  disabled={!allEmailsValid || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <ReloadIcon className="mr-2 animate-spin" />
                      Queuing…
                    </>
                  ) : (
                    "Queue Emails"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogType === "success" ? "Done" : "Error"}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="whitespace-pre-line">{dialogMessage}</div>
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
