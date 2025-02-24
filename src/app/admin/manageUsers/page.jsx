"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import AdminDashboard from "@/components/admin-dashboard";

export default function UsersPage() {
  const { user, loading, checkingAuth } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const usersRef = ref(rtdb, "users");
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        setUsers(data ? Object.values(data) : []);
        setDataLoading(false);
      });
    }
  }, [user]);

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
  
    try {
      const response = await fetch("/api/deleteUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: selectedUser.email }),
      });
  
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to delete user");
  
      setAlertMessage(`User ${selectedUser.email} deleted successfully!`);
      setIsError(false);
  
      // Remove from local state
      setUsers(users.filter((u) => u.email !== selectedUser.email));
    } catch (error) {
      console.error("Error deleting user:", error);
      setAlertMessage(error.message || "Failed to delete user. Please try again.");
      setIsError(true);
    }
  
    setDialogOpen(false);
    setAlertOpen(true);
    setSelectedUser(null);
  };
  

  const handleRoleChange = async (email, role) => {
    try {
      // Update role in Realtime Database
      const updatedUsers = users.map((u) =>
        u.email === email ? { ...u, role } : u
      );
      await set(ref(rtdb, "users"), updatedUsers);

      // Send request to set custom claim
      await fetch("/api/setCustomClaim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });

      setAlertMessage(`Role updated successfully for ${email}!`);
      setIsError(false);
      setAlertOpen(true);
    } catch (error) {
      console.error("Error updating role:", error);
      setAlertMessage("Failed to update role. Please try again.");
      setIsError(true);
      setAlertOpen(true);
    }
  };

  if (loading || checkingAuth || dataLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    router.push("/");
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-start p-4 space-y-4">
      <AdminDashboard />
      <div className="flex items-center justify-center w-full">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-center">Users List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <select
                        value={user.role}
                        style={{ backgroundColor: 'black', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px' }}
                        onChange={(e) => handleRoleChange(user.email, e.target.value)}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setDialogOpen(true);
                        }}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{selectedUser?.email}</strong>?
          </AlertDialogDescription>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <AlertDialogAction onClick={handleDeleteUser}>Remove</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success/Error Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{isError ? "Error" : "Success"}</AlertDialogTitle>
          <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          <div className="flex justify-end">
            <Button onClick={() => setAlertOpen(false)}>OK</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
