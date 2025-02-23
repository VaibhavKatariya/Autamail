"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EmailLogs() {
  const { user, loading, checkingAuth } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading || checkingAuth) return;

    if (!user) {
      router.push("/");
      return;
    }

    const fetchEmailLogs = async () => {
      try {
        // Fetch logs from the user's specific sentEmails subcollection
        const userEmailLogsQuery = query(
          collection(db, `users/${user.uid}/sentEmails`),
          orderBy("sentAt", "desc")
        );
        const snapshot = await getDocs(userEmailLogsQuery);
        const fetchedLogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLogs(fetchedLogs);
      } catch (err) {
        setError(err);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchEmailLogs();
  }, [user, loading, checkingAuth, router]);

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
                      {log.emails.map((email) => (
                        <li key={email.id}>
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
