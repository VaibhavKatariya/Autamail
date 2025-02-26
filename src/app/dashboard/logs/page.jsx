"use client";

import EmailLogs from "@/components/EmailLogs";
import LogsLoading from "@/components/skeletonUI/logsLoading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { user, loading, isAdmin, checkingAuth } = useAuth();
  const router = useRouter();
  
  if (!user) return router.replace("/");

  if (loading || checkingAuth) return <LogsLoading />;

  const collectionPath = isAdmin ? "sentEmails" : `users/${user.uid}/sentEmails`;

  return <EmailLogs collectionPath={collectionPath} />;
}
