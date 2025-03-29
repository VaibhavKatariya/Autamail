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
import { useObjectVal } from "react-firebase-hooks/database";
import { ref, set } from "firebase/database";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { rtdb, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input component
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function UsersList() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // State for filtered users
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  const [rtdbUsers, rtdbLoading, rtdbError] = useObjectVal(ref(rtdb, "users"));

  useEffect(() => {
    if (isAdmin && !rtdbLoading && rtdbUsers) {
      const fetchFirestoreData = async () => {
        const rtdbUsersArray = rtdbUsers ? Object.values(rtdbUsers) : [];

        const firestoreUsersPromises = rtdbUsersArray.map(async (rtdbUser) => {
          try {
            const usersCollection = collection(db, "users");
            const q = query(
              usersCollection,
              where("email", "==", rtdbUser.email)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const firestoreData = userDoc.data();

              const sentEmailsCollection = collection(
                db,
                `users/${userDoc.id}/sentEmails`
              );
              const countSnapshot = await getCountFromServer(
                sentEmailsCollection
              );
              const sentEmailsCount = countSnapshot.data().count;

              return {
                ...rtdbUser,
                enrollment: firestoreData.rollNumber || "",
                name: firestoreData.name || "",
                hasLoggedIn: true,
                sentEmailsCount,
              };
            } else {
              return {
                ...rtdbUser,
                enrollment: "",
                name: "",
                hasLoggedIn: false,
                sentEmailsCount: 0,
              };
            }
          } catch (error) {
            console.error(`Error fetching Firestore data for ${rtdbUser.email}:`, error);
            return {
              ...rtdbUser,
              enrollment: "",
              name: "",
              hasLoggedIn: false,
              sentEmailsCount: 0,
            };
          }
        });

        const enrichedUsers = await Promise.all(firestoreUsersPromises);
        setUsers(enrichedUsers);
        setFilteredUsers(enrichedUsers); // Initialize filtered users
      };

      fetchFirestoreData();
    }
  }, [isAdmin, rtdbUsers, rtdbLoading]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter((user) =>
      [user.email, user.name, user.enrollment].some((field) =>
        field?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

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
      if (!response.ok)
        throw new Error(result.message || "Failed to delete user");

      setAlertMessage(`User ${selectedUser.email} deleted successfully!`);
      setIsError(false);

      setUsers(users.filter((u) => u.email !== selectedUser.email));
    } catch (error) {
      console.error("Error deleting user:", error);
      setAlertMessage(
        error.message || "Failed to delete user. Please try again."
      );
      setIsError(true);
    }

    setDialogOpen(false);
    setAlertOpen(true);
    setSelectedUser(null);
  };

  const handleRoleChange = async (email, role) => {
    try {
      const updatedUsers = users.map((u) =>
        u.email === email ? { ...u, role } : u
      );
      await set(ref(rtdb, "users"), updatedUsers);

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

  if (rtdbError) {
    return <div>Error loading users: {rtdbError.message}</div>;
  }

  return (
    <>
      <div className="flex items-center justify-center w-full">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-center">Users List</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search by email, name, or enrollment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {rtdbLoading ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Index</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Has Logged In</TableHead>
                      <TableHead>Sent Emails</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.enrollment}</TableCell>
                        <TableCell>{user.hasLoggedIn ? "Yes" : "No"}</TableCell>
                        <TableCell>{user.sentEmailsCount}</TableCell>
                        <TableCell>
                          <select
                            value={user.role}
                            style={{
                              backgroundColor: "black",
                              color: "white",
                              border: "none",
                              padding: "0.5rem",
                              borderRadius: "4px",
                            }}
                            onChange={(e) =>
                              handleRoleChange(user.email, e.target.value)
                            }
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{" "}
            <strong>{selectedUser?.email}</strong>?
          </AlertDialogDescription>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <AlertDialogAction onClick={handleDeleteUser}>
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{isError ? "Error" : "Success"}</AlertDialogTitle>
          <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          <div className="flex justify-end">
            <Button onClick={() => setAlertOpen(false)}>OK</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}