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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function UsersList() {
  const { isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [confirmUser, setConfirmUser] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers(1);
  }, [isAdmin]);

  useEffect(() => {
    const reload = () => fetchUsers(1);
    window.addEventListener("users-updated", reload);
    return () => window.removeEventListener("users-updated", reload);
  }, []);

  const fetchUsers = async (pageNo) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users?page=${pageNo}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setUsers(pageNo === 1 ? data.users : [...users, ...data.users]);
      setHasMore(data.hasMore);
      setPage(pageNo);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid, role) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change-role", uid, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Role updated");
      setUsers((u) => u.map((x) => (x.uid === uid ? { ...x, role } : x)));
    } catch {
      toast.error("Failed to update role");
    }
  };

  const confirmDelete = async () => {
    if (!confirmUser) return;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          uid: confirmUser.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("User deleted");
      setUsers((u) => u.filter((x) => x.uid !== confirmUser.uid));
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmUser(null);
    }
  };

  const filtered = users.filter((u) =>
    [u.email, u.name, u.enrollment].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <>
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>

        <CardContent>
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Role</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.enrollment}</TableCell>
                  <TableCell>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                      className="bg-black border px-2 py-1"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmUser(u)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasMore && (
            <Button
              className="mt-4 w-full"
              disabled={loading}
              onClick={() => fetchUsers(page + 1)}
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmUser}
        onOpenChange={() => setConfirmUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <b>{confirmUser?.email}</b>? This will remove access and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmUser(null)}>
              Cancel
            </Button>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
