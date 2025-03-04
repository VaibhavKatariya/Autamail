"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/addUser";
import ApproveUsers from "@/components/approveUser";
import UsersList from "@/components/usersList";


export default function UsersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    router.replace("/dashboard");
    return;
  }

  return (
    <div className="flex flex-col items-center justify-start p-4 space-y-4">
      <ApproveUsers />
      <UsersList />
      {/* <AdminDashboard /> */}
    </div>
  );
}
