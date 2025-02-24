"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default function EmailLogs() {
  const { user, loading, checkingAuth } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const emailLogsQuery = query(
    collection(db, "sentEmails"),
    orderBy("timestamp", "desc")
  );

  const [logsSnapshot, logsLoading, error] = useCollection(emailLogsQuery);

  if (loading || checkingAuth) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    router.push("/");
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  if (logsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen">Error loading logs.</div>;
  }

  const logs = logsSnapshot?.docs.map((doc) => ({ id: doc.id, ...doc.data() })) || [];

  const filteredLogs = logs.filter((log) => {
    const sender = log.sentBy?.toLowerCase() || "";
    const recipient = log.companyName?.toLowerCase() || "";
    const recipientEmail = log.email?.toLowerCase() || "";
    return (
      sender.includes(searchQuery.toLowerCase()) ||
      recipient.includes(searchQuery.toLowerCase()) ||
      recipientEmail.includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Email Logs</CardTitle>
          <Input
            type="text"
            placeholder="Search by Sender, Recipient Name, or Email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
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
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.sentBy || "Unknown"}</TableCell>
                  <TableCell>{log.templateUsed || "N/A"}</TableCell>
                  <TableCell>{log.companyName || "N/A"}</TableCell>
                  <TableCell>{log.email || "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: log.status === 500 ? "red" : "cyan" }}
                    ></span>
                    {log.status || "N/A"}
                  </TableCell>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}