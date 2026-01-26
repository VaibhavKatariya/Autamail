"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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
  const { isAdmin, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState([]);
  const [confirmMode, setConfirmMode] = useState(null); // "single" | "bulk"
  const [confirmUsers, setConfirmUsers] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers(1);
  }, [isAdmin]);

  const fetchUsers = async (pageNo) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users?page=${pageNo}`);
      const data = await res.json();
      if (!res.ok) throw new Error();

      setUsers(pageNo === 1 ? data.users : [...users, ...data.users]);
      setHasMore(data.hasMore);
      setPage(pageNo);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (uid) => {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  };

  const openSingleDelete = (user) => {
    if (user.uid === currentUser.uid) {
      toast.error("You cannot delete your own admin account");
      return;
    }
    setConfirmUsers([user]);
    setConfirmMode("single");
  };

  const openBulkDelete = () => {
    const targets = users.filter(
      (u) => selected.includes(u.uid) && u.uid !== currentUser.uid
    );

    if (!targets.length) {
      toast.error("No valid users selected");
      return;
    }

    setConfirmUsers(targets);
    setConfirmMode("bulk");
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          uids: confirmUsers.map((u) => u.uid),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(
        confirmMode === "bulk"
          ? "Users deleted successfully"
          : "User deleted successfully"
      );

      setUsers((u) =>
        u.filter((x) => !confirmUsers.some((d) => d.uid === x.uid))
      );
      setSelected([]);
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmUsers([]);
      setConfirmMode(null);
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
      setUsers((u) =>
        u.map((x) => (x.uid === uid ? { ...x, role } : x))
      );
    } catch {
      toast.error("Failed to update role");
    }
  };

  const filtered = users.filter((u) =>
    [u.email, u.name, u.enrollment]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users</CardTitle>
          {selected.length > 0 && (
            <Button variant="destructive" onClick={openBulkDelete}>
              Delete Selected ({selected.length})
            </Button>
          )}
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
                <TableHead />
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
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(u.uid)}
                      disabled={u.uid === currentUser.uid}
                      onChange={() => toggleSelect(u.uid)}
                    />
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.enrollment}</TableCell>
                  <TableCell>
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleRoleChange(u.uid, e.target.value)
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
                      disabled={u.uid === currentUser.uid}
                      onClick={() => openSingleDelete(u)}
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
      <AlertDialog open={confirmUsers.length > 0}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmMode === "bulk" ? "Delete Users" : "Delete User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMode === "bulk"
                ? `Are you sure you want to permanently delete ${confirmUsers.length} users?`
                : `Are you sure you want to permanently delete ${confirmUsers[0]?.email}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmUsers([]);
                setConfirmMode(null);
              }}
            >
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
