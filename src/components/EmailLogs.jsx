"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReloadIcon } from "@radix-ui/react-icons";
import { getFirestore, collection, getDocs, query, orderBy, limit, startAfter, startAt, doc, writeBatch } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/skeletonUI/logsLoading";


export default function EmailLogs({collectionPath}) {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [prevDocs, setPrevDocs] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  // Fetch email logs from Firestore
  const fetchEmailLogs = async (next = false, prev = false) => {
    setRefreshing(true);
    setLogsLoading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // fetch logs from firestore
      const db = getFirestore();
      const emailsRef = collection(db, collectionPath);

      let q;
      const pageSize = 10;

      if (next && lastDoc) {
        q = query(emailsRef, orderBy("sentAt", "desc"), startAfter(lastDoc), limit(pageSize));
      } else if (prev && prevDocs.length > 0) {
        q = query(emailsRef, orderBy("sentAt", "desc"), startAt(prevDocs[prevDocs.length - 1]), limit(pageSize));
        setPrevDocs(prevDocs.slice(0, -1));
      } else {
        q = query(emailsRef, orderBy("sentAt", "desc"), limit(pageSize));
      }

      const snapshot = await getDocs(q);

      if (snapshot.docs.length > 0) {
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === pageSize);
      } else {
        setHasMore(false);
      }

      if (next) setPrevDocs([...prevDocs, firstDoc]);

      const emailLogs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLogs(emailLogs);
      setFilteredLogs(emailLogs);

      updateLogsStatus(emailLogs);
    } catch (err) {
      setError(err);
    } finally {
      setLogsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Mailgun status for a specific message ID
  const fetchMailgunStatus = async (messageId) => {
    console.log("fetching status for message ID:", messageId);
    const apiKey = process.env.NEXT_PUBLIC_MAILGUN_API_KEY;
    const domain = process.env.NEXT_PUBLIC_MAILGUN_DOMAIN;
    const url = `https://api.eu.mailgun.net/v3/${domain}/events?message-id=${messageId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch status for message ID: ${messageId}`);
    }

    const data = await response.json();
    return data.items[0]?.event || "unknown";
  };

  // Update logs with Mailgun statuses and patch Firestore
  const updateLogsStatus = async (logs) => {
    const logsToCheck = logs.filter((log) => log.status !== "failed" && log.status !== "delivered");

    const statusPromises = logsToCheck.map(async (log) => {
      try {
        const newStatus = await fetchMailgunStatus(log.messageId);
        return newStatus !== log.status ? { ...log, status: newStatus } : null;
      } catch (error) {
        console.error(error);
        return null;
      }
    });

    const updatedLogs = (await Promise.all(statusPromises)).filter(Boolean);

    if (updatedLogs.length > 0) {
      await patchUpdatedLogs(updatedLogs);
    }

    setLogs((prevLogs) =>
      prevLogs.map((log) => {
        const updatedLog = updatedLogs.find((ul) => ul.id === log.id);
        return updatedLog ? updatedLog : log;
      })
    );
  };

  // Patch only modified logs to Firestore
  const patchUpdatedLogs = async (logs) => {
    try {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated");
      }

      const batch = writeBatch(db);

      logs.forEach((log) => {
        // Update global sentEmails collection
        const globalDocRef = doc(db, "sentEmails", log.id);
        batch.update(globalDocRef, { status: log.status });

        // Update user-specific sentEmails subcollection
        const userDocRef = doc(db, `users/${log.uid}/sentEmails`, log.id);
        batch.update(userDocRef, { status: log.status });
      });

      await batch.commit();
      console.log("Updated logs in both collections successfully");
    } catch (error) {
      console.error("Error updating logs:", error);
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

  if(logsLoading) {
    return <Loading/>
  }

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Email Logs</CardTitle>
            <Button onClick={() => fetchEmailLogs()} disabled={refreshing}>
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
                    <TableHead>Copy ID</TableHead>
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
                                log.status === "delivered"
                                  ? "green"
                                  : log.status === "failed"
                                    ? "red"
                                    : log.status === "bounced"
                                      ? "orange"
                                      : "gray",
                            }}
                          ></span>
                          {log.status || "Checking..."}
                        </div>
                      </TableCell>
                      <TableCell>{log.sentAt ? new Date(log.sentAt).toLocaleString() : "N/A"}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(log.id);
                            toast.success("Message ID copied!");
                          }}
                          className="p-1 hover:bg-gray-200 rounded-md transition"
                        >
                          <CopyIcon className="w-4 h-4 text-gray-600" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-gray-500 p-4">No matching results found.</div>
            )}
          </CardContent>
        </div>
        {/* Pagination Buttons */}
        <div className="flex justify-between p-4">
          <Button onClick={() => fetchEmailLogs(false, true)} disabled={prevDocs.length === 0}>
            Previous
          </Button>
          <Button onClick={() => fetchEmailLogs(true)} disabled={!hasMore}>
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
