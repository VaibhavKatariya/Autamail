"use client";

import { useEffect, useState, useRef } from "react";
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
import { toast } from "sonner";
import { useQueuedEmails } from "@/context/QueuedEmailsContext";
import ApproveEmailsSkeleton from "@/components/skeletonUI/approveEmailsSkeleton";

export default function ApproveEmailsPage() {
  const { emails, cursor, loading, fetchQueuedEmails, removeEmails } =
    useQueuedEmails();

  const [actionLoading, setActionLoading] = useState(false);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchQueuedEmails();
  }, [fetchQueuedEmails]);

  const handleBulkAction = async (action, ids) => {
    try {
      setActionLoading(true);

      const res = await fetch("/api/reviewQueuedEmails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          queueIds: ids,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message);
      removeEmails(ids);
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex justify-center w-full p-6">
      <Card className="w-full max-w-6xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Approve Queued Emails</CardTitle>

          {emails.length > 0 && (
            <div className="flex gap-2">
              <Button
                disabled={actionLoading}
                onClick={() =>
                  handleBulkAction(
                    "approve",
                    emails.map((e) => e.id),
                  )
                }
              >
                Approve All (Page)
              </Button>
              <Button
                variant="destructive"
                disabled={actionLoading}
                onClick={() =>
                  handleBulkAction(
                    "reject",
                    emails.map((e) => e.id),
                  )
                }
              >
                Reject All (Page)
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading && emails.length === 0 ? (
            <ApproveEmailsSkeleton />
          ) : emails.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No queued emails pending approval
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {emails.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.email}</TableCell>
                    <TableCell>{e.name || "-"}</TableCell>
                    <TableCell>{e.template}</TableCell>
                    <TableCell>{e.fromEmail}</TableCell>
                    <TableCell>
                      {e.requestedAt
                        ? new Date(e.requestedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleBulkAction("approve", [e.id])}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actionLoading}
                        onClick={() => handleBulkAction("reject", [e.id])}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {cursor && (
            <Button
              className="mt-4 w-full"
              variant="outline"
              disabled={loading}
              onClick={() => fetchQueuedEmails()}
            >
              {loading ? "Loading…" : "Load More"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
