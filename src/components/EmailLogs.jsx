"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/skeletonUI/logsLoading";
import { useAuth } from "@/context/AuthContext";

export default function EmailLogs({ userData, onBack }) {
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);

  const fetchLogs = async (reset = false) => {
    if (!user) return;

    try {
      setLoading(true);

      const token = await user.getIdToken();

      const url =
        reset || !cursor
          ? "/api/emailLogs"
          : `/api/emailLogs?cursor=${cursor}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setLogs(reset ? data.emails : (prev) => [...prev, ...data.emails]);
      setCursor(data.nextCursor || null);
    } catch (err) {
      toast.error(err.message || "Failed to load email logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [user]);

  if (loading) return <Loading />;
  return (
    <div className="flex justify-center w-full p-4">
      <Card className="w-full max-w-5xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>
            {userData ? `Email Logs for ${userData.name}` : "Email Logs"}
          </CardTitle>

          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button onClick={() => fetchLogs(true)}>Refresh</Button>
          </div>
        </CardHeader>

        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No email logs found
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.fromEmail}</TableCell>
                      <TableCell>{log.template}</TableCell>
                      <TableCell>{log.name}</TableCell>
                      <TableCell>{log.email}</TableCell>
                      <TableCell>{log.status}</TableCell>
                      <TableCell>
                        {log.sentAt
                          ? new Date(log.sentAt).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(log.id);
                            toast.success("Copied");
                          }}
                        >
                          <CopyIcon className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {cursor && (
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => fetchLogs()}
                >
                  Load more
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
