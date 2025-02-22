"use client";

import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EmailLogs() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const emailLogsQuery = query(collection(db, "sentEmails"), orderBy("sentAt", "desc"));
  const [logsSnapshot, logsLoading, error] = useCollection(emailLogsQuery);

  if (loading || logsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen">Error loading logs.</div>;
  }

  const logs = logsSnapshot?.docs.map((doc) => ({ id: doc.id, ...doc.data() })) || [];

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Email Logs</CardTitle>
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
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.emails[0]?.sentBy || "Unknown"}</TableCell>
                  <TableCell>{log.emails[0]?.templateUsed || "N/A"}</TableCell>
                  <TableCell>
                    <ul>
                      {log.emails.map((email, index) => (
                        <li key={index}>{email.companyName} ({email.email})</li>
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