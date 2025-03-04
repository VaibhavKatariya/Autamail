"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReloadIcon } from "@radix-ui/react-icons";
import { getFirestore, collection, getDocs, query, orderBy, limit, startAfter, startAt } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { CopyIcon, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/skeletonUI/logsLoading";

export default function QueuedEmails() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [prevDocs, setPrevDocs] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingStates, setSendingStates] = useState({});
  const [deletingStates, setDeletingStates] = useState({});

  const fetchQueuedEmails = async (next = false, prev = false) => {
    setRefreshing(true);
    setLoading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const db = getFirestore();
      const emailsRef = collection(db, "queuedEmails");

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
      setSendingStates({}); // Reset sending states on refresh
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendQueuedEmails = async () => {
    if (sendingAll) return;
    setSendingAll(true);
    try {
      const emailIds = logs.map(log => log.id);

      const response = await fetch('/api/send-queued-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to send emails');
      }

      toast.success('Queued emails sent successfully!');
      await fetchQueuedEmails();
    } catch (err) {
      toast.error('Error sending emails: ' + err.message);
    } finally {
      setSendingAll(false);
    }
  };

  const sendSingleEmail = async (emailId) => {
    if (sendingStates[emailId]) return;
    setSendingStates(prev => ({ ...prev, [emailId]: true }));

    try {
      const response = await fetch('/api/send-queued-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailIds: [emailId] }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast.success('Email sent successfully!');
      await fetchQueuedEmails();
    } catch (err) {
      toast.error('Error sending email: ' + err.message);
    } finally {
      setSendingStates(prev => ({ ...prev, [emailId]: false }));
    }
  };

  useEffect(() => {
    fetchQueuedEmails();
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

  const deleteEmailLog = async (log) => {
    if (deletingStates[log.id]) return;
    setDeletingStates(prev => ({ ...prev, [log.id]: true }));

    try {
      const queuedResponse = await fetch('/api/setEmailLog', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'queuedEmails',
          docId: log.id,
        }),
      });

      if (!queuedResponse.ok) {
        throw new Error('Failed to delete from queuedEmails');
      }

      if (log.uid) {
        const userResponse = await fetch('/api/setEmailLog', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collectionName: `users/${log.uid}/sentEmails`,
            docId: log.id,
          }),
        });

        if (!userResponse.ok) {
          throw new Error('Failed to delete from sentEmails');
        }
      }

      toast.success('Email removed from queue successfully!');
      await fetchQueuedEmails();
    } catch (err) {
      toast.error('Error deleting email: ' + err.message);
    } finally {
      setDeletingStates(prev => ({ ...prev, [log.id]: false }));
    }
  };

  // Helper to check if any email is being sent
  const isAnyEmailSending = sendingAll || Object.values(sendingStates).some(state => state);

  if (error) {
    return <div className="flex justify-center items-center h-screen">Error loading queued emails: {error.message}</div>;
  }

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Queued Emails</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => fetchQueuedEmails()} disabled={refreshing || loading}>
                {refreshing ? <ReloadIcon className="animate-spin" /> : "Refresh"}
              </Button>
              <Button 
                onClick={sendQueuedEmails} 
                disabled={sendingAll || loading || logs.length === 0}
              >
                {sendingAll ? (
                  <ReloadIcon className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Send Queued Emails
              </Button>
            </div>
          </div>
          <Input
            type="text"
            placeholder="Search by sender, recipient name, or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
            disabled={loading}
          />
        </CardHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <CardContent>
            {loading ? (
              <Loading />
            ) : filteredLogs.length > 0 ? (
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
                    <TableHead>Actions</TableHead>
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
                            style={{ backgroundColor: "gray" }}
                          ></span>
                          {log.status}
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
                          disabled={loading}
                        >
                          <CopyIcon className="w-4 h-4 text-gray-600" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendSingleEmail(log.id)}
                            disabled={sendingStates[log.id] || loading}
                          >
                            {sendingStates[log.id] ? (
                              <ReloadIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            <span className="ml-2">Send</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteEmailLog(log)}
                            disabled={deletingStates[log.id] || loading || isAnyEmailSending}
                          >
                            {deletingStates[log.id] ? (
                              <ReloadIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            <span className="ml-2">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-gray-500 p-4">
                No queued emails found.
              </div>
            )}
          </CardContent>
        </div>
        <div className="flex justify-between p-4">
          <Button 
            onClick={() => fetchQueuedEmails(false, true)} 
            disabled={prevDocs.length === 0 || loading}
          >
            Previous
          </Button>
          <Button 
            onClick={() => fetchQueuedEmails(true)} 
            disabled={!hasMore || loading}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}