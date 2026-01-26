"use client";

import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";

export default function ManageUsersLayout({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return null; 
  }

  if (!user) {
    redirect("/");
  }

  if (!isAdmin) {
    redirect("/dashboard");
  }
  
  return <>{children}</>;
}
