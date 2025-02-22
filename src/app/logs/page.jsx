"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EmailLogs() {
  const [user] = useAuthState(auth);
  const router = useRouter();

//   useEffect(() => {
//     if (!user) {
//       router.push("/");
//     }
//   }, [user, router]);

  const emailLogsQuery = query(collection(db, "email_logs"), orderBy("timestamp", "desc"));
  const [logsSnapshot, loading, error] = useCollection(emailLogsQuery);

  if (!user || loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
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
                <TableHead>Companies</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.senderName || "Unknown"} ({log.senderEmail})</TableCell>
                  <TableCell>{log.templateUsed}</TableCell>
                  <TableCell>
                    <ul>
                      {log.companies.map((company, index) => (
                        <li key={index}>{company.name} ({company.email})</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell>{log.timestamp?.toDate().toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
