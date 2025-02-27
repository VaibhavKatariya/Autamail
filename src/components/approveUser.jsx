"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, set, get, remove } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import formData from "form-data";
import Mailgun from "mailgun.js";

export default function ApproveUsers() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialog, setDialog] = useState({ open: false, message: "", onConfirm: null });
  const [disapproveDialog, setDisapproveDialog] = useState({
    open: false,
    member: null,
    reason: "",
    isAll: false,
    onConfirm: null
  });

  useEffect(() => {
    if (user) {
      const membersRef = ref(rtdb, "members");
      const usersRef = ref(rtdb, "users");

      onValue(membersRef, (snapshot) => {
        setMembers(snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : []);
      });

      onValue(usersRef, (snapshot) => {
        setUsers(snapshot.val() ? snapshot.val() : []);
      });
    }
  }, [user]);

  const sendEmail = async (email, name, isApproval, reason = "") => {
    try {
      const mailgun = new Mailgun(formData);
      const mg = mailgun.client({
        username: "api",
        key: process.env.NEXT_PUBLIC_MAILGUN_API_KEY,
        url: "https://api.eu.mailgun.net",
      });


      const message = isApproval
        ? {
          from: "GDG JIIT Admin <admin@gdg-jiit.com>",
          to: [email],
          subject: "Access Approved: GDG JIIT Admin Portal",
          text: `Hello ${name},\n\nYou have been approved to access the GDG JIIT mailing site. You can now log in and start sending email at:\n\n🔗 [GDG JIIT Mail Portal](https://mailing.gdg-jiit.com/)\n\nBest regards,\n${user?.displayName}`
        }
        : {
          from: "GDG JIIT Admin <admin@gdg-jiit.com>",
          to: [email],
          subject: "Access Disapproved: GDG JIIT Admin Portal",
          text: `Hello ${name},\n\nYour request to access the GDG JIIT mailing Portal has been disapproved${reason.length > 0 ? " for the following reason:\n\n" + reason : "."}\n\nIf you have any questions, please contact the admin.\n\nBest regards,\n${user?.displayName}`
        };

      const response = await mg.messages.create(process.env.NEXT_PUBLIC_MAILGUN_DOMAIN, message);
    } catch (error) {
      console.error("Error sending email:", error?.response?.body || error);
    }
  };

  const approveUser = async (member) => {
    try {
      const usersRef = ref(rtdb, "users");
      const snapshot = await get(usersRef);
      let usersList = snapshot.exists() ? snapshot.val() : [];

      if (usersList.some((user) => user.email === member.email)) {
        setDialog({
          open: true,
          message: "User already approved.",
          onConfirm: () => setDialog({ open: false }),
        });
      } else {
        usersList.push({ email: member.email, name: member.name , rollNumber: member.rollNumber, role: "member" });
        await set(usersRef, usersList);
        await remove(ref(rtdb, `members/${member.id}`));
        setMembers(members.filter((m) => m.id !== member.id));
        await sendEmail(member.email, member.name, true);
      }
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const approveAllUsers = async () => {
    try {
      const usersRef = ref(rtdb, "users");
      const snapshot = await get(usersRef);
      let usersList = snapshot.exists() ? snapshot.val() : [];

      for (const member of members) {
        if (!usersList.some((user) => user.email === member.email)) {
          usersList.push({ email: member.email, name: member.name , rollNumber: member.rollNumber, role: "member" });
          await sendEmail(member.email, member.name, true);
        }
      }

      await set(usersRef, usersList);
      await remove(ref(rtdb, "members"));
      setMembers([]);

      setDialog({
        open: true,
        message: "All users have been approved.",
        onConfirm: () => setDialog({ open: false }),
      });
    } catch (error) {
      console.error("Error approving all users:", error);
      setDialog({
        open: true,
        message: "Failed to approve all users. Please try again.",
        onConfirm: () => setDialog({ open: false }),
      });
    }
  };

  const disapproveUser = (member) => {
    setDisapproveDialog({
      open: true,
      member,
      reason: "",
      isAll: false,
      onConfirm: async () => {
        try {
          setDisapproveDialog((prev) => {
            const reasonToSend = prev.reason;
            remove(ref(rtdb, `members/${member.id}`));
            setMembers((current) => current.filter((m) => m.id !== member.id));
            sendEmail(member.email, member.name, false, reasonToSend);
            setDialog({
              open: true,
              message: `User ${member.name} has been disapproved.`,
              onConfirm: () => setDialog({ open: false }),
            });
            return { open: false, member: null, reason: "", isAll: false }; // Reset state
          });
        } catch (error) {
          console.error("Error disapproving user:", error);
        }
      },
    });
  };

  const disapproveAllUsers = () => {
    setDisapproveDialog({
      open: true,
      member: null,
      reason: "",
      isAll: true,
      onConfirm: async () => {
        try {
          setDisapproveDialog((prev) => {
            const reasonToSend = prev.reason;
            for (const member of members) {
              sendEmail(member.email, member.name, false, reasonToSend);
            }
            remove(ref(rtdb, "members"));
            setMembers([]);
            setDialog({
              open: true,
              message: "All users have been disapproved.",
              onConfirm: () => setDialog({ open: false }),
            });
            return { open: false, member: null, reason: "", isAll: false };
          });
        } catch (error) {
          console.error("Error disapproving all users:", error);
        }
      },
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    router.push("/");
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Pending Approvals</CardTitle>
            <div className="flex space-x-2">
              <Button onClick={approveAllUsers} disabled={members.length === 0}>Approve All</Button>
              <Button variant="destructive" onClick={disapproveAllUsers} disabled={members.length === 0}>Disapprove All</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center text-gray-500">No users pending approval.</div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Index</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Enrollment No.</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member, index) => (
                    <TableRow key={member.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.rollNumber}</TableCell>
                      <TableCell>{member.timestamp}</TableCell>
                      <TableCell className="flex space-x-2">
                        <Button onClick={() => approveUser(member)}>Approve</Button>
                        <Button variant="destructive" onClick={() => disapproveUser(member)}>Disapprove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Dialog */}
      {dialog.open && (
        <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notification</DialogTitle>
            </DialogHeader>
            <DialogDescription>{dialog.message}</DialogDescription>
            <DialogFooter>
              <Button onClick={dialog.onConfirm}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Disapprove Reason Dialog */}
      {disapproveDialog.open && (
        <Dialog
          open={disapproveDialog.open}
          onOpenChange={(open) => setDisapproveDialog({ ...disapproveDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disapprove {disapproveDialog.isAll ? "All Users" : "User"}</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Please provide a reason for disapproval (optional):
            </DialogDescription>
            <Input
              value={disapproveDialog.reason}
              onChange={(e) => setDisapproveDialog({ ...disapproveDialog, reason: e.target.value })}
              placeholder="Enter reason for disapproval"
            />
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setDisapproveDialog({ open: false, member: null, reason: "", isAll: false })}
              >
                Cancel
              </Button>
              <Button onClick={disapproveDialog.onConfirm}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}