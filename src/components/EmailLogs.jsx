"use client";

import { useEffect } from "react";
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
import { useEmailLogs } from "@/context/EmailLogsContext";

export default function EmailLogs({ userData, onBack }) {
  const { logs, loading, cursor, initialized, fetchLogs, refreshLogs, loadMore } = useEmailLogs();

  useEffect(() => {
    // Only fetch if not already initialized
    if (!initialized) {
      fetchLogs(true);
    }
  }, [initialized, fetchLogs]);

  if (loading && !initialized) return <Loading />;

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
            <Button onClick={refreshLogs} disabled={loading}>
              Refresh
            </Button>
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
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load more"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}