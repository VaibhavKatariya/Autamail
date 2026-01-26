"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUsersData } from "@/context/UsersDataContext";
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

  const {
    pendingUsers,
    setPendingUsers,
    addApprovedUser,
    fetchAllOnce,
    pendingLoading,
  } = useUsersData();

  const [actionLoading, setActionLoading] = useState(null);

  // 🔒 Admin guard + fetch ONCE
  useEffect(() => {
    if (loading) return;

    if (!isAdmin) {
      toast.error("Unauthorized");
      return;
    }

    fetchAllOnce();
  }, [isAdmin, loading, fetchAllOnce]);

  const handleAction = async (user, action) => {
    try {
      setActionLoading(user.uid);

      const res = await fetch("/api/manageUsers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          uid: user.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message);

      // ❌ remove from pending cache
      setPendingUsers((prev) =>
        prev.filter((u) => u.uid !== user.uid)
      );

      // ✅ if approved, push to users cache
      if (action === "approve") {
        addApprovedUser(data.user);
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || pendingLoading) return null;

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Pending Access Requests</CardTitle>
      </CardHeader>

      <CardContent>
        {pendingUsers.length === 0 ? (
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
              {pendingUsers.map((u, i) => (
                <TableRow key={u.uid}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.enrollment}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={actionLoading === u.uid}
                      onClick={() => handleAction(u, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading === u.uid}
                      onClick={() => handleAction(u, "disapprove")}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
