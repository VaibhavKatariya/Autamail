"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
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
        // Query the sentEmails collection for logs sent by the current user
        const sentEmailsQuery = query(
          collection(db, "sentEmails"),
          where("sentBy", "==", user.email), // Filter by the current user's email
          orderBy("timestamp", "desc") // Order by timestamp in descending order
        );

        const snapshot = await getDocs(sentEmailsQuery);
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
                    <TableCell>{log.sentBy || "Unknown"}</TableCell>
                    <TableCell>{log.templateUsed || "N/A"}</TableCell>
                    <TableCell>{log.companyName || "N/A"}</TableCell>
                    <TableCell>{log.email || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: log.status === "pending" ? "yellow" : log.status === "failed" ? "red" : "cyan" }}
                      ></span>
                      {log.status || "N/A"}
                    </TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
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
