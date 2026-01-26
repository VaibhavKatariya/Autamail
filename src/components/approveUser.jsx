"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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

export default function ApproveUsers() {
  const { isAdmin, loading } = useAuth();

  const [users, setUsers] = useState([]);
  const [pageToken, setPageToken] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // 🔒 Admin guard
  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Unauthorized");
    }
  }, [isAdmin, loading]);

  // 📥 Fetch pending users
  const fetchUsers = async (reset = false) => {
    try {
      setFetching(true);

      const url = reset
        ? "/api/manageUsers"
        : `/api/manageUsers?pageToken=${pageToken}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to fetch users");
        return;
      }

      setUsers((prev) =>
        reset ? data.users : [...prev, ...data.users]
      );
      setPageToken(data.nextPageToken || null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers(true);
  }, [isAdmin]);

  // ✅ Approve / ❌ Disapprove
  const handleAction = async (uid, action) => {
    try {
      setActionLoading(uid);

      const res = await fetch("/api/manageUsers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, uid }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Action failed");
        return;
      }

      toast.success(data.message);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return null;

  return (
    <Card className="w-full max-w-5xl">
      <CardHeader>
        <CardTitle>Pending Access Requests</CardTitle>
      </CardHeader>

      <CardContent>
        {users.length === 0 && !fetching ? (
          <p className="text-center text-muted-foreground">
            No pending requests
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.map((u, i) => (
                <TableRow key={u.uid}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.enrollment}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={actionLoading === u.uid}
                      onClick={() => handleAction(u.uid, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading === u.uid}
                      onClick={() => handleAction(u.uid, "disapprove")}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {pageToken && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => fetchUsers()}
              disabled={fetching}
              variant="outline"
            >
              {fetching ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
