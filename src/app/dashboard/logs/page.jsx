"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdvancedSearch from "@/components/AdvanceEmailLog"; 
import EmailLogs from "@/components/EmailLogs";
import EmailLogsResult from "@/components/EmailLogsResult";
import LogsLoading from "@/components/skeletonUI/logsLoading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Page() {
  const { user, loading, isAdmin, checkingAuth } = useAuth();
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !checkingAuth && !user) {
      router.replace("/");
    }
  }, [user, loading, checkingAuth, router]);

  if (loading || checkingAuth) return <LogsLoading />;

  if (!user) return null; 
  
  const collectionPath = isAdmin ? "sentEmails" : `users/${user.uid}/sentEmails`;

  return (
    (isAdmin ? <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-10vh)] p-4 min-h-screen">
      <Tabs defaultValue="normal" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="normal">Normal</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="normal">
          <EmailLogs collectionPath={collectionPath} />
        </TabsContent>
        <TabsContent value="advanced">
          {!userData ? (
            <AdvancedSearch onUserFound={setUserData} />
          ) : (
            <EmailLogsResult uid={userData.uid} userData={userData} />
          )}
        </TabsContent>
      </Tabs>
    </div> : < EmailLogs collectionPath={collectionPath} />)
  );
}