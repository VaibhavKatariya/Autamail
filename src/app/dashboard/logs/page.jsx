"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdvancedSearch from "@/components/AdvanceEmailLog";
import EmailLogs from "@/components/EmailLogs";
import LogsLoading from "@/components/skeletonUI/logsLoading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EmailStatsChart from "@/components/LogsCharts";

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

  const collectionPath = isAdmin ? "sentEmails" : `users/${user.uid}/sentEmails`;
  const chartCollectionPath = isAdmin ? "emailStats/global" : `users/${user.uid}/sentEmails`;

  return (
    (isAdmin ?
      <div className="flex flex-col items-center justify-center w-full p-4 min-h-screen">
        <EmailStatsChart isAdmin={isAdmin} userId={user.uid} />
        <Tabs defaultValue="normal" className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="normal">Normal</TabsTrigger>
            <TabsTrigger value="queued">Queued</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="normal" className="h-[calc(100vh-20vh)] overflow-y-auto">
            <EmailLogs collectionPath={collectionPath} />
          </TabsContent>

          <TabsContent value="advanced" className="h-[calc(100vh-20vh)] overflow-y-auto">
            {!userData ? (
              <AdvancedSearch onUserFound={setUserData} />
            ) : (
                <EmailLogs
                  isAdvance={true}
                  uid={userData.uid}
                  userData={userData}
                  onBack={() => setUserData(null)}
                />
            )}
          </TabsContent>
        </Tabs>
      </div>
      : (<>
        <EmailLogs collectionPath={collectionPath} />
      </>)
    )
  );
}