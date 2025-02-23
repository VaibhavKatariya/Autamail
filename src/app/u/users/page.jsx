"use client";

import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth, rtdb } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function UsersPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

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
      const updatedUsers = users.filter((email) => email !== selectedUser);
      await set(ref(rtdb, "users"), updatedUsers);

      setAlertMessage(`User ${selectedUser} removed successfully!`);
      setIsError(false);
    } catch (error) {
      console.error("Error removing user:", error);
      setAlertMessage("Failed to remove user. Please try again.");
      setIsError(true);
    }

    setDialogOpen(false);
    setAlertOpen(true);
    setSelectedUser(null);
  };

  if (loading || dataLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((email, index) => (
                <TableRow key={index}>
                  <TableCell>{email}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedUser(email);
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

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{selectedUser}</strong>?
          </AlertDialogDescription>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
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
