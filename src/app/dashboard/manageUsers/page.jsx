"use client";

import ApproveUsers from "@/components/approveUser";
import UsersList from "@/components/usersList";

export default function ManageUsersPage() {
  return (
    <div className="flex flex-col items-center justify-start p-4 space-y-4">
      <ApproveUsers />
      {/* <UsersList /> */}
    </div>
  );
}
