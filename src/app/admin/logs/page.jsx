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

  const emailLogsQuery = query(collection(db, "sentEmails"), orderBy("sentAt", "desc"));
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
    const sender = log.emails[0]?.sentBy?.toLowerCase() || "";
    const recipients = log.emails.map(email => email.companyName?.toLowerCase()).join(" ");
    return sender.includes(searchQuery.toLowerCase()) || recipients.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Email Logs</CardTitle>
          <Input
            type="text"
            placeholder="Search by Sender or Recipient"
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
                <TableHead>Recipients</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.emails[0]?.sentBy || "Unknown"}</TableCell>
                  <TableCell>{log.emails[0]?.templateUsed || "N/A"}</TableCell>
                  <TableCell>
                    <ul>
                      {log.emails.map((email, index) => (
                        <li key={index}>
                          {email.companyName} ({email.email})
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell>{new Date(log.sentAt.toDate()).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
