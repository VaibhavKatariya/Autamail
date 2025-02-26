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
import formData from "form-data";
import Mailgun from "mailgun.js";

export default function ApproveUsers() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialog, setDialog] = useState({ open: false, message: "", onConfirm: null });

  useEffect(() => {
    if (user) {
      console.log(user)
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

  const sendApprovalEmail = async (email, name) => {
    try {
      const mailgun = new Mailgun(formData);
      const mg = mailgun.client({
        username: "api",
        key: process.env.NEXT_PUBLIC_MAILGUN_API_KEY,
        url: "https://api.eu.mailgun.net",
      });

      const response = await mg.messages.create(process.env.NEXT_PUBLIC_MAILGUN_DOMAIN, {
        from: "GDG JIIT Admin <admin@gdg-jiit.com>",
        to: [email],
        subject: "Access Approved: GDG JIIT Admin Portal",
        text: `Hello ${name},\n\nYou have been approved to access the site. You can now log in and explore at:\n\n🔗 [GDG JIIT Mail Portal](https://mailing.gdg-jiit.com/)\n\nBest regards,\n${user?.displayName} (Admin @ GDG Mailing Portal)`,
      });

      console.log("Mailgun response:", response);
    } catch (error) {
      console.error("Error sending approval email:", error?.response?.body || error);
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
        usersList.push({ email: member.email, role: "member" });
        await set(usersRef, usersList);
        await remove(ref(rtdb, `members/${member.id}`));
        setMembers(members.filter((m) => m.id !== member.id));

        // Send approval email
        await sendApprovalEmail(member.email, member.name);
      }
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const disapproveUser = async (memberId) => {
    try {
      await remove(ref(rtdb, `members/${memberId}`));
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error("Error disapproving user:", error);
    }
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
          <CardTitle>Pending Approvals</CardTitle>
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
                      <Button variant="destructive" onClick={() => disapproveUser(member.id)}>Disapprove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
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
    </div>
  );
}
