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
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

export default function EmailLogs(props) {
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
  const [totalDocs, setTotalDocs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch email logs from Firestore
  const fetchEmailLogs = async (next = false, prev = false) => {
    setRefreshing(true);
    setLogsLoading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const db = getFirestore();
      const collectionPath = props.uid ? `users/${props.uid}/sentEmails` : props.collectionPath;
      const emailsRef = collection(db, collectionPath);

      // Get total count of documents (only on first load or refresh)
      if (!next && !prev) {
        const snapshot = await getDocs(emailsRef);
        setTotalDocs(snapshot.size);
        setCurrentPage(1);
      }

      let q;
      const pageSize = 10;

      if (next && lastDoc) {
        q = query(emailsRef, orderBy("sentAt", "desc"), startAfter(lastDoc), limit(pageSize));
        setCurrentPage(currentPage + 1);
      } else if (prev && prevDocs.length > 0) {
        q = query(emailsRef, orderBy("sentAt", "desc"), startAt(prevDocs[prevDocs.length - 1]), limit(pageSize));
        setPrevDocs(prevDocs.slice(0, -1));
        setCurrentPage(currentPage - 1);
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

  const recheckStatuses = async () => {
    setRefreshing(true);
    try {
      const updatedLogs = await Promise.all(
        logs.map(async (log) => {
          try {
            const { status, reason } = await fetchMailgunStatus(log.messageId);
            if (status === "failed") {
              return { ...log, status, reason }
            }
            return status !== log.status ? { ...log, status, reason } : null;
          } catch (error) {
            console.error(`Error fetching status for ${log.id}:`, error);
            return null;
          }
        })
      );

      const filteredUpdatedLogs = updatedLogs.filter(Boolean);
      if (filteredUpdatedLogs.length > 0) {
        await patchUpdatedLogs(filteredUpdatedLogs);
      }

      setLogs((prevLogs) =>
        prevLogs.map((log) => {
          const updatedLog = filteredUpdatedLogs.find((ul) => ul.id === log.id);
          return updatedLog ? { ...log, status: updatedLog.status, reason: updatedLog.reason } : log;
        })
      );

      toast.success("Statuses updated successfully!");
    } catch (error) {
      console.error("Error rechecking statuses:", error);
      toast.error("Failed to update statuses");
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch Mailgun status for a specific message ID
  const fetchMailgunStatus = async (messageId) => {
    const cleanedMessageId = messageId.replace(/^<|>$/g, ""); // Removes leading and trailing <>
    console.log("Fetching status for message ID:", cleanedMessageId);

    const apiKey = process.env.NEXT_PUBLIC_MAILGUN_API_KEY;
    const domain = process.env.NEXT_PUBLIC_MAILGUN_DOMAIN;
    const url = `https://api.eu.mailgun.net/v3/${domain}/events?message-id=${cleanedMessageId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch status for message ID: ${cleanedMessageId}`);
    }

    const data = await response.json();
    console.log(data.items[0]["delivery-status"].message)
    const event = data.items[0] || {};

    return {
      status: event.event || "unknown",
      reason: event["delivery-status"]?.message || "No reason provided",
    };
  };

  // Update logs with Mailgun statuses and patch Firestore
  const updateLogsStatus = async (logs) => {
    const logsToCheck = logs.filter(
      (log) => log.status !== "delivered" && log.status !== "failed" && log.status !== "queued"
    );

    const statusPromises = logsToCheck.map(async (log) => {
      try {
        const { status, reason } = await fetchMailgunStatus(log.messageId);
        return status !== log.status ? { ...log, status, reason } : null;
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
        const globalDocRef = doc(db, "sentEmails", log.id);
        batch.set(globalDocRef, { status: log.status, reason: log.reason }, { merge: true });

        if (log.uid) {  // Ensure uid exists before trying to update user-specific logs
          const userDocRef = doc(db, `users/${log.uid}/sentEmails`, log.id);
          batch.set(userDocRef, { status: log.status, reason: log.reason }, { merge: true });
        }
      });

      await batch.commit();
      console.log("Updated logs with failure reasons successfully");
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

  if (logsLoading) {
    return <Loading />;
  }

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {props.userData && props.userData.name
                ? `Email Logs for ${props.userData.name} (${props.userData.rollNumber || ""})`
                : "Email Logs"}
            </CardTitle>
            <div className="flex gap-2">
              {props.onBack && (
                <Button variant="outline" onClick={props.onBack}>
                  Back
                </Button>
              )}
              <Button onClick={() => fetchEmailLogs()} disabled={refreshing}>
                {refreshing ? <ReloadIcon className="animate-spin" /> : "Refresh"}
              </Button>
              <Button onClick={() => recheckStatuses()} disabled={refreshing}>
                {refreshing ? <ReloadIcon className="animate-spin" /> : "Recheck Status"}
              </Button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {searchQuery ? (
              <>Showing {filteredLogs.length} of {logs.length} filtered logs (out of {totalDocs} total)</>
            ) : (
              <>Showing {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, totalDocs)} of {totalDocs} logs</>
            )}
          </div>
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
                    <EmailRow key={log.id} log={log} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <>
                {props.uid ? (
                  <div className="text-center text-gray-500 p-4">No email logs found for this user.</div>
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    Wow, look at that! A whole lot of... NOTHING. Maybe if you actually sent some emails instead of
                    just chilling, this wouldn't be empty ¯\_(ツ)_/¯
                  </div>
                )}
              </>
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

const EmailRow = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow key={log.id} onClick={() => setExpanded(!expanded)} className="cursor-pointer">
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
          {log.status === "failed" && <button
              className="p-1"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </button>}
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
      {expanded && log.status === "failed" && (
        <TableRow>
          <TableCell colSpan={7} className="bg-red-900 text-red-300 p-4">
            <strong>Failure Reason:</strong> {log.reason || "No details available"}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};