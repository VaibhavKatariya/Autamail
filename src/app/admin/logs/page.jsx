"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReloadIcon } from "@radix-ui/react-icons";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailStatuses, setEmailStatuses] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEmailLogs = async () => {
    setRefreshing(true);
    setLogsLoading(true);
    setError(null);
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const db = getFirestore();
      const emailsRef = collection(db, `users/${user.uid}/sentEmails`);
      const snapshot = await getDocs(emailsRef);
      
      const emailLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(emailLogs);
      setFilteredLogs(emailLogs);
    } catch (err) {
      setError(err);
    } finally {
      setLogsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  useEffect(() => {
    const filtered = logs.filter(
      (log) =>
        log.fromEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

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
          <Input
            type="text"
            placeholder="Search by sender, recipient name, or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <CardContent>
            {filteredLogs.length > 0 ? (
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
                      <TableCell>{log.fromEmail}</TableCell>
                      <TableCell>{log.template}</TableCell>
                      <TableCell>{log.name}</TableCell>
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
                      <TableCell>{log.sentAt ? new Date(log.sentAt).toLocaleString() : "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-gray-500 p-4">
                <p>No matching results found.</p>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
