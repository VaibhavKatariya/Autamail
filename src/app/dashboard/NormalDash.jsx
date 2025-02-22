'use client'
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase"; // Ensure this path matches your Firebase config
import { AppSidebar } from "@/components/App-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import SponsorEmailDashboard from "@/components/email";

export default function NormalDash() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else {
        setCheckingAuth(false);
      }
    }
  }, [user, loading, router]);

  if (checkingAuth) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main>
          <SponsorEmailDashboard />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
