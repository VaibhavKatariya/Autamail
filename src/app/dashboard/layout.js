"use client";

import { AppSidebar } from "@/components/sidebar";
import ClientOnly from "@/components/ClientOnly";
import SendEmailFormSkeleton from "@/components/skeletonUI/sendEmailForm";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UsersDataProvider } from "@/context/UsersDataContext";

export default function DashboardLayout({ children }) {
  const { user, role, loading, checkingAuth } = useAuth();
  const router = useRouter();

  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  useEffect(() => {
    if (loading || checkingAuth) return;

    // 🔒 Not logged in
    if (!user) {
      router.replace("/");
      return;
    }

    if (role === null) {
      router.replace("/requestAccess");
    }
  }, [user, role, loading, checkingAuth, router]);

  if (loading || checkingAuth) {
    return <ClientOnly><SendEmailFormSkeleton /></ClientOnly>;
  }

  // Prevent UI flash
  if (!user || !role) return null;

  if (isMaintenanceMode) {
    return (
      <div className="dark:text-white flex flex-col items-center justify-center w-full h-screen p-4">
        <h1 className="text-3xl font-bold mb-4">Maintenance in Progress</h1>
        <p className="text-lg text-center">
          The app is currently unavailable due to scheduled maintenance. Please
          try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="dark text-white">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </header>
          <main>
            <UsersDataProvider>{children}</UsersDataProvider>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
