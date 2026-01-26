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
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useUsersData } from "@/context/UsersDataContext";
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
  const { isAdmin, user } = useAuth();

  const {
    users,
    setUsers,
    fetchAllOnce,
    loading,
  } = useUsersData();

  const [search, setSearch] = useState("");
  const [confirmUser, setConfirmUser] = useState(null);

  // 🔹 Fetch ONCE from shared cache
  useEffect(() => {
    if (!isAdmin) return;
    fetchAllOnce();
  }, [isAdmin, fetchAllOnce]);

  const handleRoleChange = async (targetUser, newRole) => {
    // 🔒 prevent admin changing own role
    if (targetUser.uid === user.uid) {
      toast.error("You cannot change your own role");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-role",
          uid: targetUser.uid,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Role updated");

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === targetUser.uid ? { ...u, role: newRole } : u
        )
      );
    } catch {
      toast.error("Failed to update role");
    }
  };

  const confirmDelete = async () => {
    if (!confirmUser) return;

    // 🔒 prevent admin deleting self
    if (confirmUser.uid === user.uid) {
      toast.error("You cannot delete your own account");
      setConfirmUser(null);
      return;
    }

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

      setUsers((prev) =>
        prev.filter((u) => u.uid !== confirmUser.uid)
      );
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmUser(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    [u.email, u.name, u.enrollment].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
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
              {filteredUsers.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.enrollment}</TableCell>
                  <TableCell>
                    <select
                      value={u.role}
                      disabled={u.uid === user.uid}
                      onChange={(e) =>
                        handleRoleChange(u, e.target.value)
                      }
                      className="bg-black border px-2 py-1"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      disabled={u.uid === user.uid}
                      onClick={() => setConfirmUser(u)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {loading && (
            <div className="text-center text-sm text-gray-400 mt-4">
              Loading users…
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!confirmUser}
        onOpenChange={() => setConfirmUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <b>{confirmUser?.email}</b>? This cannot be undone.
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
