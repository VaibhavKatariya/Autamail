"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons"; // Radix UI Spinner
import formData from "form-data";
import Mailgun from "mailgun.js";

export default function EmailLogs() {
  const { user, loading, checkingAuth } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailStatuses, setEmailStatuses] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({ username: "api", key: process.env.NEXT_PUBLIC_MAILGUN_API_KEY });

  useEffect(() => {
    if (loading || checkingAuth) return;

    if (!user) {
      router.push("/");
      return;
    }

    fetchEmailLogs();
  }, [user, loading, checkingAuth, router]);

  const fetchEmailLogs = async () => {
    setRefreshing(true);
    setLogsLoading(true);

    try {
      const sentEmailsQuery = query(
        collection(db, "sentEmails"),
        // where("sentBy", "==", user?.email),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(sentEmailsQuery);
      const fetchedLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        messageId: doc.data().messageId || null,
        sentBy: doc.data().sentBy || "Unknown",
        templateUsed: doc.data().templateUsed || "N/A",
        companyName: doc.data().companyName || "N/A",
        email: doc.data().email || "N/A",
        timestamp: doc.data().timestamp || null,
      }));

      setLogs(fetchedLogs);

      const messageIds = fetchedLogs.map((log) => log.messageId).filter(Boolean);
      if (messageIds.length > 0) {
        await fetchEmailStatuses(messageIds);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLogsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEmailStatuses = async (messageIds) => {
    try {
      const statuses = {};

      for (const messageId of messageIds) {
        const response = await fetch(
          `https://api.eu.mailgun.net/v3/${process.env.NEXT_PUBLIC_MAILGUN_DOMAIN}/events?message-id=${messageId}&limit=1`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${btoa(`api:${process.env.NEXT_PUBLIC_MAILGUN_API_KEY}`)}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Mailgun API error: ${response.status}`);
        }

        const data = await response.json();
        statuses[messageId] = data.items.length > 0 ? data.items[0].event : "Unknown";
      }

      setEmailStatuses(statuses);
    } catch (error) {
      console.error("Error fetching email statuses:", error);
    }
  };

  if (logsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen">Error loading logs: {error.message}</div>;
  }

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Email Logs</CardTitle>
            <Button onClick={fetchEmailLogs} disabled={refreshing}>
              {refreshing ? <ReloadIcon className="animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient Name</TableHead>
                  <TableHead>Recipient Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.sentBy}</TableCell>
                    <TableCell>{log.templateUsed}</TableCell>
                    <TableCell>{log.companyName}</TableCell>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              emailStatuses[log.messageId] === "delivered"
                                ? "green"
                                : emailStatuses[log.messageId] === "failed"
                                ? "red"
                                : emailStatuses[log.messageId] === "bounced"
                                ? "orange"
                                : "gray",
                          }}
                        ></span>
                        {emailStatuses[log.messageId] || "Checking..."}
                      </div>
                    </TableCell>
                    <TableCell>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-gray-500 p-4">
              <p>Wow, look at that! A whole lot of... NOTHING. Maybe if you actually sent some emails instead of just chilling, this wouldn&apos;t be empty ¯\_(ツ)_/¯</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
