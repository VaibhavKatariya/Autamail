"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReloadIcon } from "@radix-ui/react-icons";
import { getFirestore, collection, getDocs, query, orderBy, limit, startAfter, startAt } from "firebase/firestore";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/skeletonUI/logsLoading";

export default function EmailLogsResult({ uid, userData, onBack }) {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [prevDocs, setPrevDocs] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const collectionPath = `users/${uid}/sentEmails`;

  // Fetch email logs from Firestore
  const fetchEmailLogs = async (next = false, prev = false) => {
    setRefreshing(true);
    setLogsLoading(true);
    setError(null);

    try {
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
    } catch (err) {
      setError(err);
    } finally {
      setLogsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (uid) fetchEmailLogs(); // Fetch logs when uid is provided
  }, [uid]);

  useEffect(() => {
    const filtered = logs.filter(
      (log) =>
        (log.fromEmail?.toLowerCase().includes(searchQuery.toLowerCase()) || "") ||
        (log.name?.toLowerCase().includes(searchQuery.toLowerCase()) || "") ||
        (log.email?.toLowerCase().includes(searchQuery.toLowerCase()) || "")
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  if (error) {
    return <div className="flex justify-center items-center h-screen">Error loading logs: {error.message}</div>;
  }

  if (logsLoading) {
    return <Loading />;
  }

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Email Logs for {userData.name} ({userData.rollNumber})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={() => fetchEmailLogs()} disabled={refreshing}>
                {refreshing ? <ReloadIcon className="animate-spin" /> : "Refresh"}
              </Button>
            </div>
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
                      <TableCell>{log.fromEmail || "N/A"}</TableCell>
                      <TableCell>{log.template || "N/A"}</TableCell>
                      <TableCell>{log.name || "N/A"}</TableCell>
                      <TableCell>{log.email || "N/A"}</TableCell>
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
                          {log.status || "Unknown"}
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
              <div className="text-center text-gray-500 p-4">
                No email logs found for this user.
              </div>
            )}
          </CardContent>
        </div>
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