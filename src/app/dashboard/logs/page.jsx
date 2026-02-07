"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdvancedSearch from "@/components/AdvanceEmailLog";
import EmailLogs from "@/components/EmailLogs";
import LogsLoading from "@/components/skeletonUI/logsLoading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Page() {
  const { user, loading, isAdmin, checkingAuth } = useAuth();
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !checkingAuth && !user) {
      router.replace("/");
    }
  }, [user, loading, checkingAuth, router]);

  if (loading || checkingAuth) return <LogsLoading />;
  if (!user) return null;

  return (
    isAdmin ? (
      <div className="flex flex-col items-center w-full p-4 min-h-screen">
        <Tabs defaultValue="normal" className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="normal">Logs</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="normal" className="h-[calc(100vh-20vh)] overflow-y-auto">
            <EmailLogs mode="admin" />
          </TabsContent>

          <TabsContent value="advanced" className="h-[calc(100vh-20vh)] overflow-y-auto">
            {!userData ? (
              <AdvancedSearch onUserFound={setUserData} />
            ) : (
              <EmailLogs
                mode="admin"
                uid={userData.uid}
                userData={userData}
                onBack={() => setUserData(null)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    ) : (
      <EmailLogs mode="user" uid={user.uid} />
    )
  );
}
